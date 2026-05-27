import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../hooks/useToast';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import api, { type Course } from '../../../services/api';
import { 
  Plus, 
  X,
  GraduationCap,
  BookOpen,
  DollarSign,
  Building2,
  Sparkles
} from 'lucide-react';
import { downloadCoursesPdf } from '../utils/adminPdf';

interface CourseFormData {
  name: string;
  category: string;
  description: string;
  institution: string;
  duration: string;
  cutoff_2023: number | '';
  cutoff_2022: number | '';
  avg_fees_ksh: number | '';
  programme_code: string;
  subject_requirement_1: string;
  subject_requirement_2: string;
  subject_requirement_3: string;
  subject_requirement_4: string;
  related_hub: string;
}

const initialFormData: CourseFormData = {
  name: '',
  category: '',
  description: '',
  institution: '',
  duration: '',
  cutoff_2023: '',
  cutoff_2022: '',
  avg_fees_ksh: '',
  programme_code: '',
  subject_requirement_1: '',
  subject_requirement_2: '',
  subject_requirement_3: '',
  subject_requirement_4: '',
  related_hub: '',
};

const CATEGORIES = [
  'Technology', 'Medicine', 'Engineering', 'Law', 
  'Business', 'Education', 'Healthcare', 'Science',
  'Arts', 'Social Sciences', 'Agriculture',
  'Architecture', 'Nursing', 'Pharmacy', 'Veterinary',
  'Environmental', 'Marine', 'Psychology', 'Statistics'
];

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { addToast } = useToast();
  const [reindexing, setReindexing] = useState(false);
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [feesMin, setFeesMin] = useState<string>('');
  const [feesMax, setFeesMax] = useState<string>('');
  const [cutoffMin, setCutoffMin] = useState<string>('');
  const [cutoffMax, setCutoffMax] = useState<string>('');

  const institutions = useMemo(
    () => Array.from(new Set(courses.map(c => c.institution).filter(Boolean))).sort() as string[],
    [courses]
  );

  const displayedCourses = useMemo(() => {
    return courses.filter(c => {
      if (institutionFilter !== 'all' && c.institution !== institutionFilter) return false;
      if (feesMin !== '' && (c.avg_fees_ksh == null || c.avg_fees_ksh < Number(feesMin))) return false;
      if (feesMax !== '' && (c.avg_fees_ksh == null || c.avg_fees_ksh > Number(feesMax))) return false;
      if (cutoffMin !== '' && (c.cutoff_2023 == null || Number(c.cutoff_2023) < Number(cutoffMin))) return false;
      if (cutoffMax !== '' && (c.cutoff_2023 == null || Number(c.cutoff_2023) > Number(cutoffMax))) return false;
      return true;
    });
  }, [courses, institutionFilter, feesMin, feesMax, cutoffMin, cutoffMax]);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await api.admin.triggerReindex();
      addToast(res.message || 'AI database successfully updated!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Failed to update AI database.', 'error');
    } finally {
      setReindexing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses().catch(() => undefined);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.listCourses({
        search: searchQuery.trim() || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      });
      setCourses(res.results);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        category: course.category || '',
        description: course.description || '',
        institution: course.institution || '',
        duration: course.duration || '',
        cutoff_2023: course.cutoff_2023 ?? '',
        cutoff_2022: course.cutoff_2022 ?? '',
        avg_fees_ksh: course.avg_fees_ksh ?? '',
        programme_code: course.programme_code || '',
        subject_requirement_1: course.subject_requirement_1 || '',
        subject_requirement_2: course.subject_requirement_2 || '',
        subject_requirement_3: course.subject_requirement_3 || '',
        subject_requirement_4: course.subject_requirement_4 || '',
        related_hub: course.related_hub || '',
      });
    } else {
      setEditingCourse(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData(initialFormData);
    setError(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setInstitutionFilter('all');
    setFeesMin('');
    setFeesMax('');
    setCutoffMin('');
    setCutoffMax('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Partial<Course> = {
        name: formData.name,
        category: formData.category,
        description: formData.description || '',
        duration: formData.duration || '',
        institution: formData.institution || '',
        cutoff_2023: formData.cutoff_2023 === '' ? null : Number(formData.cutoff_2023),
        cutoff_2022: formData.cutoff_2022 === '' ? null : Number(formData.cutoff_2022),
        avg_fees_ksh: formData.avg_fees_ksh === '' ? null : Number(formData.avg_fees_ksh),
        programme_code: formData.programme_code || null,
        subject_requirement_1: formData.subject_requirement_1 || null,
        subject_requirement_2: formData.subject_requirement_2 || null,
        subject_requirement_3: formData.subject_requirement_3 || null,
        subject_requirement_4: formData.subject_requirement_4 || null,
        related_hub: formData.related_hub || null,
      };

      if (editingCourse) {
        await api.admin.updateCourse(editingCourse.id, payload);
        addToast('Course updated successfully', 'success');
      } else {
        await api.admin.createCourse(payload as Omit<Course, 'id' | 'created_at' | 'updated_at'>);
        addToast('Course created successfully', 'success');
      }

      await fetchCourses();
      handleCloseModal();
    } catch (err: any) {
      console.error('Failed to save course:', err);
      setError(err?.message || 'Failed to save course');
      addToast(err.message || 'Failed to save course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.name}"?`)) return;

    try {
      await api.admin.deleteCourse(course.id);
      addToast('Course deleted successfully', 'success');
      await fetchCourses();
    } catch (err) {
      console.error('Failed to delete course:', err);
      addToast('Failed to delete course', 'error');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => api.admin.deleteCourse(id)));
      addToast(`${ids.length} courses deleted successfully`, 'success');
      await fetchCourses();
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to delete courses:', err);
      addToast('Failed to delete some courses', 'error');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Technology': 'bg-blue-500/20 text-blue-400',
      'Medicine': 'bg-green-500/20 text-green-400',
      'Engineering': 'bg-orange-500/20 text-orange-400',
      'Law': 'bg-purple-500/20 text-purple-400',
      'Business': 'bg-yellow-500/20 text-yellow-400',
      'Education': 'bg-pink-500/20 text-pink-400',
    };
    return colors[category] || 'bg-slate-700 text-slate-300';
  };

  const columns: Column<Course>[] = [
    {
      key: 'name',
      header: 'Course',
      sortable: true,
      render: (course) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-teal-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white truncate max-w-[240px]">{course.name}</p>
            {course.programme_code && (
              <p className="text-xs text-slate-500">{course.programme_code}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (course) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(course.category)}`}>
          {course.category || '—'}
        </span>
      ),
    },
    {
      key: 'institution',
      header: 'Institution',
      sortable: true,
      render: (course) => (
        <span className="flex items-center gap-1 text-slate-300 text-sm">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {course.institution || <span className="text-slate-600">—</span>}
        </span>
      ),
    },
    {
      key: 'cutoff_2023',
      header: 'Cutoff 2023',
      sortable: true,
      render: (course) => (
        <span className="text-slate-300 font-mono text-sm">
          {course.cutoff_2023 != null ? Number(course.cutoff_2023).toFixed(3) : '—'}
        </span>
      ),
    },
    {
      key: 'avg_fees_ksh',
      header: 'Avg Fees (KSh)',
      sortable: true,
      render: (course) => (
        <span className="text-slate-300 text-sm flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-slate-500" />
          {course.avg_fees_ksh != null ? Number(course.avg_fees_ksh).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  // Category stats
  const categoryCounts = courses.reduce((acc, course) => {
    acc[course.category] = (acc[course.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDownloadPdf = () => downloadCoursesPdf(courses);

  return (
    <AdminLayout onDownloadPdf={handleDownloadPdf}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
          <p className="text-slate-400">Manage all courses in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleReindex}
            disabled={reindexing}
            className="bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-teal-300 transition-all duration-300"
          >
            <Sparkles className={`w-4 h-4 mr-2 ${reindexing ? 'animate-spin' : ''}`} />
            {reindexing ? 'Updating AI...' : 'Sync AI Database'}
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Search courses</label>
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course name, institution, or description"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Institution</label>
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All institutions</option>
              {institutions.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Min Fees (KSh)</label>
            <Input
              type="number"
              value={feesMin}
              onChange={(e) => setFeesMin(e.target.value)}
              placeholder="e.g. 50,000"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Max Fees (KSh)</label>
            <Input
              type="number"
              value={feesMax}
              onChange={(e) => setFeesMax(e.target.value)}
              placeholder="e.g. 300,000"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Cutoff 2023 Range</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.001"
                value={cutoffMin}
                onChange={(e) => setCutoffMin(e.target.value)}
                placeholder="Min"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Input
                type="number"
                step="0.001"
                value={cutoffMax}
                onChange={(e) => setCutoffMax(e.target.value)}
                placeholder="Max"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{displayedCourses.length}</span>
            {displayedCourses.length !== courses.length && (
              <span> of <span className="text-white font-medium">{courses.length}</span></span>
            )}
            {' '}courses
            {(institutionFilter !== 'all' || feesMin !== '' || feesMax !== '' || cutoffMin !== '' || cutoffMax !== '') && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-teal-500/20 text-teal-300">filtered</span>
            )}
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-teal-500 hover:text-teal-300"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{courses.length}</p>
              <p className="text-xs text-slate-500">Total Courses</p>
            </div>
          </div>
        </div>
        {Object.entries(categoryCounts).slice(0, 3).map(([category, count]) => (
          <div key={category} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
            <div>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-500">{category}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        data={displayedCourses}
        columns={columns}
        keyExtractor={(course) => course.id}
        loading={loading}
        searchable={false}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        emptyMessage="No courses match the current filters."
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* ── Section: Core identity ── */}
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Core details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Course Name *</label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., Bachelor of Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Institution</label>
                  <Input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., University of Nairobi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Programme Code</label>
                  <Input
                    type="text"
                    value={formData.programme_code}
                    onChange={(e) => setFormData({ ...formData, programme_code: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., J101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Duration</label>
                  <Input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 4 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Related Hub</label>
                  <Input
                    type="text"
                    value={formData.related_hub}
                    onChange={(e) => setFormData({ ...formData, related_hub: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., Technology"
                  />
                </div>
              </div>

              {/* ── Section: Cutoffs & Fees ── */}
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Cutoffs &amp; fees</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Cutoff Points 2023</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.cutoff_2023}
                    onChange={(e) => setFormData({ ...formData, cutoff_2023: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 35.000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Cutoff Points 2022</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.cutoff_2022}
                    onChange={(e) => setFormData({ ...formData, cutoff_2022: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 34.000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Avg Fees (KSh)</label>
                  <Input
                    type="number"
                    value={formData.avg_fees_ksh}
                    onChange={(e) => setFormData({ ...formData, avg_fees_ksh: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 100000"
                  />
                </div>
              </div>

              {/* ── Section: Subject Requirements ── */}
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Subject requirements</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['subject_requirement_1','subject_requirement_2','subject_requirement_3','subject_requirement_4'] as const).map((key, i) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Subject Requirement {i + 1}</label>
                    <Input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder={`e.g., Mathematics${i === 0 ? ' (compulsory)' : ''}`}
                    />
                  </div>
                ))}
              </div>

              {/* ── Section: Description ── */}
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Description</p>
              <div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
                  placeholder="Describe the course, career outcomes, etc."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

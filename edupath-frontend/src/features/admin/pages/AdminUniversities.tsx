import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { DataTable } from '../components/DataTable';
import { useToast } from '../hooks/useToast';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import api, { type University } from '../../../services/api';
import { 
  Plus, 
  X,
  Building2,
  MapPin,
  Globe,
  Users
} from 'lucide-react';
import { downloadUniversitiesPdf } from '../utils/adminPdf';

interface UniversityFormData {
  name: string;
  code: string;
  short_name: string;
  type: 'Public' | 'Private';
  location: string;
  description: string;
  website: string;
  established: number | '';
  ranking: number | '';
  students: string;
  facilities: string[];
  accreditation: string;
  logo: string;
}

const initialFormData: UniversityFormData = {
  name: '',
  code: '',
  short_name: '',
  type: 'Public',
  location: '',
  description: '',
  website: '',
  established: '',
  ranking: '',
  students: '',
  facilities: [],
  accreditation: '',
  logo: '🎓',
};

const LOCATIONS = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 
  'Thika', 'Machakos', 'Kiambu', 'Kajiado', 'Other'
];

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Public' | 'Private'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUniversities().catch(() => undefined);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, locationFilter]);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.listUniversities({
        search: searchQuery.trim() || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        location: locationFilter === 'all' ? undefined : locationFilter,
      });
      setUniversities(res.results);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
      addToast('Failed to load universities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (university?: University) => {
    if (university) {
      setEditingUniversity(university);
      setFormData({
        name: university.name,
        code: (university as any).code || '',
        short_name: university.short_name || '',
        type: university.type || 'Public',
        location: university.location || '',
        description: university.description || '',
        website: university.website || '',
        established: university.established ?? '',
        ranking: university.ranking ?? '',
        students: university.students || '',
        facilities: university.facilities || [],
        accreditation: university.accreditation || '',
        logo: university.logo || '🎓',
      });
    } else {
      setEditingUniversity(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUniversity(null);
    setFormData(initialFormData);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setLocationFilter('all');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Partial<University> & { code?: string } = {
        name: formData.name,
        code: formData.code || undefined,
        short_name: formData.short_name,
        type: formData.type,
        location: formData.location,
        description: formData.description,
        website: formData.website,
        students: formData.students,
        facilities: formData.facilities,
        accreditation: formData.accreditation,
        established: formData.established === '' ? 0 : Number(formData.established),
        ranking: formData.ranking === '' ? 0 : Number(formData.ranking),
        logo: formData.logo || '🎓',
      };

      if (editingUniversity) {
        await api.admin.updateUniversity(editingUniversity.id, payload);
        addToast('University updated successfully', 'success');
      } else {
        await api.admin.createUniversity(payload as Omit<University, 'id' | 'created_at' | 'updated_at'>);
        addToast('University created successfully', 'success');
      }

      await fetchUniversities();
      handleCloseModal();
    } catch (err: any) {
      console.error('Failed to save university:', err);
      setError(err.message || 'Failed to save university');
      addToast(err.message || 'Failed to save university', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (university: University) => {
    if (!confirm(`Are you sure you want to delete "${university.name}"?`)) return;

    try {
      await api.admin.deleteUniversity(university.id);
      addToast('University deleted successfully', 'success');
      await fetchUniversities();
    } catch (err) {
      console.error('Failed to delete university:', err);
      addToast('Failed to delete university', 'error');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => api.admin.deleteUniversity(id)));
      addToast(`${ids.length} universities deleted successfully`, 'success');
      await fetchUniversities();
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to delete universities:', err);
      addToast('Failed to delete some universities', 'error');
    }
  };

  const handleDownloadPdf = () => downloadUniversitiesPdf(universities);

  return (
    <AdminLayout onDownloadPdf={handleDownloadPdf}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Universities</h1>
          <p className="text-slate-400">Manage all universities in the system</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add University
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Search universities</label>
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by university name, short name, or description"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'Public' | 'Private')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All types</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All locations</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{universities.length}</span> universities
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-teal-500 hover:text-teal-300"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{universities.length}</p>
              <p className="text-xs text-slate-500">Total Universities</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {new Set(universities.map((u) => u.location)).size}
              </p>
              <p className="text-xs text-slate-500">Locations</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {universities.filter((u) => u.type === 'Public').length}
              </p>
              <p className="text-xs text-slate-500">Public</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {universities.filter((u) => u.type === 'Private').length}
              </p>
              <p className="text-xs text-slate-500">Private</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={universities}
        columns={[
          {
            key: 'name',
            header: 'University',
            sortable: true,
            render: (uni) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{uni.name}</p>
                  {uni.short_name && (
                    <p className="text-sm text-slate-500">{uni.short_name}</p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (uni) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  uni.type === 'Public'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {uni.type || '—'}
              </span>
            ),
          },
          {
            key: 'location',
            header: 'Location',
            sortable: true,
            render: (uni) => (
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3" />
                {uni.location || '—'}
              </span>
            ),
          },
          {
            key: 'ranking',
            header: 'Ranking',
            sortable: true,
            render: (uni) => (
              <span className="text-slate-300">
                {uni.ranking ? `#${uni.ranking}` : '—'}
              </span>
            ),
          },
          {
            key: 'established',
            header: 'Est.',
            sortable: true,
            render: (uni) => (
              <span className="text-slate-300 text-sm">{uni.established || '—'}</span>
            ),
          },
          {
            key: 'students',
            header: 'Students',
            render: (uni) => (
              <span className="text-slate-300 text-sm">{uni.students || '—'}</span>
            ),
          },
        ]}
        keyExtractor={(uni) => uni.id}
        loading={loading}
        searchable={false}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        emptyMessage="No universities found. Add your first university to get started."
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingUniversity ? 'Edit University' : 'Add New University'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── Core Identity ── */}
                <p className="md:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Identity</p>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">University Name *</label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., University of Nairobi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Short Name</label>
                  <Input
                    type="text"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., UoN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Code</label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., U001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Logo / Emoji</label>
                  <Input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 🎓 or image URL"
                  />
                </div>

                {/* ── Classification ── */}
                <p className="md:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Classification</p>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Public' | 'Private' })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Location *</label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Year Established *</label>
                  <Input
                    type="number"
                    required
                    value={formData.established}
                    onChange={(e) => setFormData({ ...formData, established: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 1970"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Ranking *</label>
                  <Input
                    type="number"
                    required
                    value={formData.ranking}
                    onChange={(e) => setFormData({ ...formData, ranking: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 1"
                  />
                </div>

                {/* ── Contact & Size ── */}
                <p className="md:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Contact &amp; size</p>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Student Count</label>
                  <Input
                    type="text"
                    value={formData.students}
                    onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., 50,000+"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Website</label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., https://www.uonbi.ac.ke"
                  />
                </div>

                {/* ── Description & Accreditation ── */}
                <p className="md:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Details</p>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
                    placeholder="Describe the university, its history, strengths..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Accreditation</label>
                  <Input
                    type="text"
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g., Commission for University Education (CUE)"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : editingUniversity ? 'Update University' : 'Create University'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

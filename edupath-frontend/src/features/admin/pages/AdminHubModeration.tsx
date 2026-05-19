import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { useToast } from '../hooks/useToast';
import {
  Users,
  ShieldCheck,
  Flag,
  ArrowLeft,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ThumbsUp,
  Calendar
} from 'lucide-react';
import api from '../../../services/api';
import type { HubStudentPost, HubAssociatePost, HubReportGroup } from '../../../services/api';

type Tab = 'student_posts' | 'associate_posts' | 'reports';

export default function AdminHubModeration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hubIdParam = searchParams.get('hub');
  
  const [tab, setTab] = useState<Tab>('student_posts');
  const [hubId, setHubId] = useState<string | null>(hubIdParam);
  const [hubName, setHubName] = useState<string>('');
  const [studentPosts, setStudentPosts] = useState<HubStudentPost[]>([]);
  const [associatePosts, setAssociatePosts] = useState<HubAssociatePost[]>([]);
  const [reports, setReports] = useState<HubReportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (hubIdParam) {
      setHubId(hubIdParam);
      loadHubData(hubIdParam);
    }
  }, [hubIdParam]);

  useEffect(() => {
    if (hubId) {
      loadTabData(tab);
    }
  }, [tab, hubId]);

  const loadHubData = async (id: string) => {
    try {
      const hubHealth = await api.adminHub.getHubHealth();
      const hub = hubHealth.find(h => h.id === id);
      if (hub) setHubName(hub.name);
    } catch (error) {
      console.error('Failed to load hub:', error);
    }
  };

  const loadTabData = async (currentTab: Tab) => {
    if (!hubId) return;
    setLoading(true);
    try {
      switch (currentTab) {
        case 'student_posts':
          const studentData = await api.adminHub.getHubStudentPosts(hubId);
          setStudentPosts(studentData);
          break;
        case 'associate_posts':
          const associateData = await api.adminHub.getHubAssociatePosts(hubId);
          setAssociatePosts(associateData);
          break;
        case 'reports':
          const reportsData = await api.adminHub.getHubReports(hubId);
          setReports(reportsData);
          break;
      }
    } catch (error) {
      console.error('Failed to load tab data:', error);
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHideAssociatePost = async (postId: number) => {
    if (!confirm('Hide this post?')) return;
    setActionLoading(true);
    try {
      await api.adminHub.hideAssociatePost(postId);
      addToast('Post hidden', 'success');
      loadTabData(tab);
    } catch (error) {
      addToast('Failed to hide post', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStrikeAssociate = async (postId: number) => {
    if (!confirm('Increment strike count for this Associate?')) return;
    setActionLoading(true);
    try {
      await api.adminHub.strikeAssociate(postId);
      addToast('Strike incremented', 'success');
      loadTabData(tab);
    } catch (error) {
      addToast('Failed to increment strike', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReports = async (postId: number) => {
    if (!confirm('Dismiss all reports for this post?')) return;
    setActionLoading(true);
    try {
      await api.adminHub.dismissAssociatePostReports(postId);
      addToast('Reports dismissed', 'success');
      loadTabData(tab);
    } catch (error) {
      addToast('Failed to dismiss reports', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHideStudentPost = async (postId: string) => {
    if (!confirm('Hide this post?')) return;
    setActionLoading(true);
    try {
      await api.adminHub.hideStudentPost(postId);
      addToast('Post hidden (requires is_visible field)', 'warning');
    } catch (error) {
      addToast('Feature requires Post model update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarnStudent = async (postId: string) => {
    if (!confirm('Send warning email to student?')) return;
    setActionLoading(true);
    try {
      await api.adminHub.warnStudent(postId);
      addToast('Warning email sent (requires email integration)', 'warning');
    } catch (error) {
      addToast('Feature requires email integration', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissStudentReports = async (postId: string) => {
    if (!confirm('Dismiss all reports for this post?')) return;
    setActionLoading(true);
    try {
      await api.adminHub.dismissStudentPostReports(postId);
      addToast('Reports dismissed (requires PostReport model)', 'warning');
    } catch (error) {
      addToast('Feature requires PostReport model', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">
          {hubName || 'Hub'} Moderation
        </h1>
        <p className="text-slate-400">Manage posts and reports for this hub</p>
      </div>

      {!hubId ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No hub selected. Please select a hub from the dashboard.</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 mb-6">
            <button
              onClick={() => setTab('student_posts')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'student_posts'
                  ? 'bg-teal-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Student Posts
            </button>
            <button
              onClick={() => setTab('associate_posts')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'associate_posts'
                  ? 'bg-violet-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Associate Posts
            </button>
            <button
              onClick={() => setTab('reports')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'reports'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flag className="w-4 h-4" />
              Reports
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === 'student_posts' && (
                <div className="space-y-4">
                  {studentPosts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No student posts in this hub</p>
                  ) : (
                    studentPosts.map((post) => (
                      <StudentPostCard
                        key={post.id}
                        post={post}
                        onHide={() => handleHideStudentPost(post.id)}
                        onWarn={() => handleWarnStudent(post.id)}
                        onDismissReports={() => handleDismissStudentReports(post.id)}
                        actionLoading={actionLoading}
                      />
                    ))
                  )}
                </div>
              )}

              {tab === 'associate_posts' && (
                <div className="space-y-4">
                  {associatePosts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No associate posts in this hub</p>
                  ) : (
                    associatePosts.map((post) => (
                      <AssociatePostCard
                        key={post.id}
                        post={post}
                        onHide={() => handleHideAssociatePost(post.id)}
                        onStrike={() => handleStrikeAssociate(post.id)}
                        onDismissReports={() => handleDismissReports(post.id)}
                        actionLoading={actionLoading}
                      />
                    ))
                  )}
                </div>
              )}

              {tab === 'reports' && (
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No open reports in this hub</p>
                  ) : (
                    reports.map((group) => (
                      <ReportGroupCard
                        key={group.post_id}
                        group={group}
                        onDismissReports={() => handleDismissReports(group.post_id)}
                        actionLoading={actionLoading}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}

function StudentPostCard({ post, onHide, onWarn, onDismissReports, actionLoading }: {
  post: HubStudentPost;
  onHide: () => void;
  onWarn: () => void;
  onDismissReports: () => void;
  actionLoading: boolean;
}) {
  const borderClass = post.report_count >= 3 ? 'border-red-500' : post.report_count >= 1 ? 'border-amber-500' : 'border-slate-800';

  return (
    <div className={`bg-slate-900/60 border ${borderClass} rounded-xl p-5`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
          <p className="text-slate-300 text-sm mb-3">{post.content}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {post.upvotes} upvotes
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-800">
        <button
          onClick={onHide}
          disabled={actionLoading}
          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          <EyeOff className="w-3.5 h-3.5 inline mr-1" />
          Hide Post
        </button>
        <button
          onClick={onWarn}
          disabled={actionLoading}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
          Warn Student
        </button>
        <button
          onClick={onDismissReports}
          disabled={actionLoading || post.report_count === 0}
          className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
          Dismiss Reports
        </button>
      </div>
    </div>
  );
}

function AssociatePostCard({ post, onHide, onStrike, onDismissReports, actionLoading }: {
  post: HubAssociatePost;
  onHide: () => void;
  onStrike: () => void;
  onDismissReports: () => void;
  actionLoading: boolean;
}) {
  const borderClass = post.report_count >= 3 ? 'border-red-500' : post.report_count >= 1 ? 'border-amber-500' : 'border-slate-800';
  const badgeColor =
    post.associate_type === 'MENTOR' ? 'bg-violet-500/20 text-violet-400' :
    post.associate_type === 'SOCIETY' ? 'bg-blue-500/20 text-blue-400' :
    'bg-amber-500/20 text-amber-400';

  return (
    <div className={`bg-slate-900/60 border ${borderClass} rounded-xl p-5`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white">{post.associate}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
              {post.associate_type}
            </span>
          </div>
          <p className="text-slate-300 text-sm mb-3">{post.content}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {post.upvotes} upvotes
            </span>
            <span className="flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" />
              {post.report_count} reports
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-800">
        <button
          onClick={onHide}
          disabled={actionLoading}
          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          <EyeOff className="w-3.5 h-3.5 inline mr-1" />
          Hide Post
        </button>
        <button
          onClick={onStrike}
          disabled={actionLoading}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5 inline mr-1" />
          Strike Associate
        </button>
        <button
          onClick={onDismissReports}
          disabled={actionLoading || post.report_count === 0}
          className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
          Dismiss Reports
        </button>
      </div>
    </div>
  );
}

function ReportGroupCard({ group, onDismissReports, actionLoading }: {
  group: HubReportGroup;
  onDismissReports: () => void;
  actionLoading: boolean;
}) {
  const badgeColor =
    group.associate_type === 'MENTOR' ? 'bg-violet-500/20 text-violet-400' :
    group.associate_type === 'SOCIETY' ? 'bg-blue-500/20 text-blue-400' :
    'bg-amber-500/20 text-amber-400';

  return (
    <div className="bg-slate-900/60 border border-amber-500/40 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white">{group.associate}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
              {group.associate_type}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {group.report_count} reports
            </span>
          </div>
          <p className="text-slate-400 text-sm">{group.post_content}</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {group.reports.map((report) => (
          <div key={report.id} className="bg-slate-800/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300">{report.reporter}</span>
              <span className="text-xs text-slate-500">
                {new Date(report.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-400">{report.reason}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-800">
        <button
          onClick={onDismissReports}
          disabled={actionLoading}
          className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
          Dismiss All
        </button>
      </div>
    </div>
  );
}

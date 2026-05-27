import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { useToast } from '../hooks/useToast';
import {
  Users, 
  ShieldCheck,
  Flag,
  FileText,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import api from '../../../services/api';
import type { DashboardStats, RecentStudentPost, RecentAssociatePost, HubHealth } from '../../../services/api';
import { downloadDashboardPdf } from '../utils/adminPdf';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentStudentPosts, setRecentStudentPosts] = useState<RecentStudentPost[]>([]);
  const [recentAssociatePosts, setRecentAssociatePosts] = useState<RecentAssociatePost[]>([]);
  const [hubHealth, setHubHealth] = useState<HubHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [reindexing, setReindexing] = useState(false);

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

  const refreshFeeds = async () => {
    try {
      const [studentPosts, associatePosts] = await Promise.all([
        api.adminHub.getRecentStudentPosts(),
        api.adminHub.getRecentAssociatePosts(),
      ]);
      setRecentStudentPosts(studentPosts);
      setRecentAssociatePosts(associatePosts);
    } catch {
      // Silent fail for auto-refresh
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, studentPosts, associatePosts, hubData] = await Promise.all([
          api.adminHub.getDashboardStats(),
          api.adminHub.getRecentStudentPosts(),
          api.adminHub.getRecentAssociatePosts(),
          api.adminHub.getHubHealth(),
        ]);
        setStats(statsData);
        setRecentStudentPosts(studentPosts);
        setRecentAssociatePosts(associatePosts);
        setHubHealth(hubData);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        addToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    // Auto-refresh feeds every 60 seconds
    const interval = setInterval(refreshFeeds, 60000);
    return () => clearInterval(interval);
  }, [addToast]);

  const getStatCardColor = (key: keyof DashboardStats) => {
    if (!stats) return 'bg-teal-500/20 border-teal-500/40 text-teal-400';
    if (key === 'open_reports') {
      return stats.open_reports === 0
        ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
        : stats.open_reports > 5
        ? 'bg-red-500/20 border-red-500/40 text-red-400'
        : 'bg-amber-500/20 border-amber-500/40 text-amber-400';
    }
    if (key === 'pending_applications') {
      return stats.pending_applications === 0
        ? 'bg-slate-500/20 border-slate-500/40 text-slate-400'
        : 'bg-amber-500/20 border-amber-500/40 text-amber-400';
    }
    return 'bg-teal-500/20 border-teal-500/40 text-teal-400';
  };

  const getTrafficLightColor = (light: 'green' | 'amber' | 'red') => {
    switch (light) {
      case 'green': return 'bg-green-500';
      case 'amber': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
    }
  };

  const handleDownloadPdf = () => downloadDashboardPdf({
    stats,
    studentPosts: recentStudentPosts,
    associatePosts: recentAssociatePosts,
    hubHealth,
  });

  return (
    <AdminLayout onDownloadPdf={handleDownloadPdf}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Platform overview and moderation hub</p>
        </div>
        <Button
          onClick={handleReindex}
          disabled={reindexing}
          className="bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-teal-300 transition-all duration-300"
        >
          <Sparkles className={`w-4 h-4 mr-2 ${reindexing ? 'animate-spin' : ''}`} />
          {reindexing ? 'Updating AI...' : 'Sync AI Database'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Active Students"
              value={stats?.total_students ?? 0}
              icon={Users}
              color="bg-blue-500/20 text-blue-400 border-blue-500/40"
            />
            <StatCard
              title="Verified Associates"
              value={stats?.verified_associates ?? 0}
              icon={ShieldCheck}
              color="bg-violet-500/20 text-violet-400 border-violet-500/40"
            />
            <StatCard
              title="Open Reports"
              value={stats?.open_reports ?? 0}
              icon={Flag}
              color={getStatCardColor('open_reports')}
            />
            <StatCard
              title="Pending Applications"
              value={stats?.pending_applications ?? 0}
              icon={FileText}
              color={getStatCardColor('pending_applications')}
            />
          </div>

          {/* Live Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Student Posts Feed */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  <h2 className="text-lg font-semibold text-white">Recent Student Posts</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Activity className="w-3 h-3" />
                  <span>Auto-refreshes</span>
                </div>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto">
                {recentStudentPosts.length === 0 ? (
                  <p className="p-6 text-center text-slate-500">No recent posts</p>
                ) : (
                  recentStudentPosts.map((post) => (
                    <div key={post.id} className="p-4 hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white line-clamp-1">{post.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>{post.author}</span>
                            <span>·</span>
                            <span>{post.hub}</span>
                            <span>·</span>
                            <span>{post.upvotes} upvotes</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/hubs/moderate?post=${post.id}`)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-colors"
                        >
                          Moderate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Associate Posts Feed */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold text-white">Recent Associate Posts</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Activity className="w-3 h-3" />
                  <span>Auto-refreshes</span>
                </div>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto">
                {recentAssociatePosts.length === 0 ? (
                  <p className="p-6 text-center text-slate-500">No recent posts</p>
                ) : (
                  recentAssociatePosts.map((post) => (
                    <div key={post.id} className="p-4 hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{post.associate}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              post.associate_type === 'MENTOR' ? 'bg-violet-500/20 text-violet-400' :
                              post.associate_type === 'SOCIETY' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {post.associate_type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>{post.hub}</span>
                            <span>·</span>
                            <span>{post.upvotes} upvotes</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/hubs/moderate?post=${post.id}`)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/30 transition-colors"
                        >
                          Moderate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Hub Health Indicators */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Hub Health</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {hubHealth.map((hub) => (
                <div
                  key={hub.id}
                  onClick={() => navigate(`/admin/hubs/moderate?hub=${hub.id}`)}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-teal-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white line-clamp-1">{hub.name}</h3>
                    <div className={`w-2.5 h-2.5 rounded-full ${getTrafficLightColor(hub.traffic_light)}`} />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Student posts (7d)</span>
                      <span className="text-white">{hub.student_posts_7d}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Associate posts (7d)</span>
                      <span className="text-white">{hub.associate_posts_7d}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Open reports</span>
                      <span className={hub.open_reports > 0 ? 'text-amber-400' : 'text-white'}>
                        {hub.open_reports}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className={`border rounded-xl p-5 ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-6 h-6" />
        <span className="text-3xl font-bold">{value.toLocaleString()}</span>
      </div>
      <p className="text-sm font-medium opacity-90">{title}</p>
    </div>
  );
}

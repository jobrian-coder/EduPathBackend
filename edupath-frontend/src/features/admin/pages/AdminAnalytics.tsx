import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useToast } from '../hooks/useToast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  Users, TrendingUp, ShieldCheck, AlertTriangle, GraduationCap, RefreshCw,
} from 'lucide-react';
import api, { type PlatformAnalytics, type DashboardStats } from '../../../services/api';

const TEAL   = '#14b8a6';
const CYAN   = '#06b6d4';
const VIOLET = '#8b5cf6';
const AMBER  = '#f59e0b';
const ROSE   = '#f43f5e';
const BLUE   = '#3b82f6';
const EMERALD= '#10b981';
const SLATE  = '#64748b';

const PIE_COLORS = [TEAL, CYAN, VIOLET, AMBER, ROSE, BLUE, EMERALD, SLATE];

const ROLE_LABELS: Record<string, string> = { novice: 'Novice', contributor: 'Contributor', expert: 'Expert', admin: 'Admin' };
const TYPE_LABELS: Record<string, string> = { MENTOR: 'Mentor', SOCIETY: 'Society', SCHOOL: 'School' };
const POST_TYPE_LABELS: Record<string, string> = { UPDATE: 'Update', OPPORTUNITY: 'Opportunity', EVENT: 'Event', RESOURCE: 'Resource' };
const STATUS_LABELS: Record<string, string> = { APPROVED: 'Approved', PENDING: 'Pending', AWAITING_RESPONSE: 'Awaiting Info', REJECTED: 'Rejected' };

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
  cursor: { fill: 'rgba(20,184,166,0.08)' },
};

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        api.adminManagement.getPlatformAnalytics(),
        api.adminHub.getDashboardStats(),
      ]);
      setAnalytics(a);
      setStats(s);
    } catch {
      addToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!analytics || !stats) {
    return (
      <AdminLayout>
        <div className="text-center py-24 text-slate-500">Failed to load analytics.</div>
      </AdminLayout>
    );
  }

  const userRolesData = analytics.user_roles.map(r => ({
    name: ROLE_LABELS[r.role] || r.role,
    value: r.count,
  }));

  const assocTypesData = analytics.associate_types.map(t => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: t.count,
  }));

  const postTypesData = analytics.associate_post_types.map(pt => ({
    name: POST_TYPE_LABELS[pt.type] || pt.type,
    count: pt.count,
  }));

  const appStatusData = analytics.application_statuses.map(a => ({
    name: STATUS_LABELS[a.status] || a.status,
    value: a.count,
  }));

  const hubActivityData = analytics.hub_activity.map(h => ({
    name: h.name.length > 12 ? h.name.slice(0, 10) + '…' : h.name,
    fullName: h.name,
    'Student Posts': h.student_posts,
    'Associate Posts': h.associate_posts,
    'Reports': h.open_reports,
  }));

  const courseCatData = analytics.courses_by_category.slice(0, 10).map(c => ({
    name: c.category.length > 14 ? c.category.slice(0, 12) + '…' : c.category,
    fullName: c.category,
    count: c.count,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Live overview of EduPath activity, users, and content</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 text-sm font-medium hover:bg-teal-500/25 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Total Students" value={stats.total_students} sub="Active learner accounts" color="bg-teal-500/20 text-teal-400" />
          <KpiCard icon={ShieldCheck} label="Verified Associates" value={stats.verified_associates} sub="Active mentors, societies & schools" color="bg-violet-500/20 text-violet-400" />
          <KpiCard icon={AlertTriangle} label="Open Reports" value={stats.open_reports} sub="Awaiting moderation action" color="bg-rose-500/20 text-rose-400" />
          <KpiCard icon={GraduationCap} label="Pending Applications" value={stats.pending_applications} sub="New associate requests" color="bg-amber-500/20 text-amber-400" />
        </div>

        {/* Row 1: Hub activity + User registrations */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Hub Activity (last 7 days)" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hubActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v: any, name: string) => [v, name]} labelFormatter={(l, p) => p[0]?.payload?.fullName || l} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="Student Posts" fill={TEAL} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Associate Posts" fill={VIOLET} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Reports" fill={ROSE} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="User Registrations (last 6 months)">
            {analytics.registrations_by_month.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-slate-500 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analytics.registrations_by_month} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke={TEAL} strokeWidth={2} dot={{ fill: TEAL, r: 4 }} name="Sign-ups" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Row 2: Pie charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <ChartCard title="User Role Breakdown">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={userRolesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} labelLine={false} label={CustomPieLabel}>
                  {userRolesData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Associate Types (Verified)">
            {assocTypesData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">No verified associates</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={assocTypesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} labelLine={false} label={CustomPieLabel}>
                    {assocTypesData.map((_, i) => <Cell key={i} fill={[VIOLET, BLUE, AMBER][i % 3]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Application Statuses">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} labelLine={false} label={CustomPieLabel}>
                  {appStatusData.map((_, i) => <Cell key={i} fill={[EMERALD, AMBER, CYAN, ROSE][i % 4]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Associate Post Types">
            {postTypesData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">No posts yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={postTypesData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={72} labelLine={false} label={CustomPieLabel}>
                    {postTypesData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Row 3: Courses by category + Top associates */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard title="Courses by Category (Top 10)">
            {courseCatData.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-slate-500 text-sm">No courses loaded</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={courseCatData} layout="vertical" margin={{ top: 4, right: 24, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={58} />
                  <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Courses']} labelFormatter={(l, p) => p[0]?.payload?.fullName || l} />
                  <Bar dataKey="count" fill={CYAN} radius={[0, 3, 3, 0]} name="Courses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Top Associates by Followers">
            {analytics.top_associates.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-slate-500 text-sm">No associates yet</div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {analytics.top_associates.map((assoc, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs w-4 text-right">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {assoc.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-200 font-medium truncate">{assoc.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          assoc.type === 'MENTOR' ? 'bg-violet-500/20 text-violet-300' :
                          assoc.type === 'SOCIETY' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>{assoc.type.charAt(0) + assoc.type.slice(1).toLowerCase()}</span>
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                            style={{ width: `${Math.min(100, (assoc.followers / (analytics.top_associates[0]?.followers || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-teal-300">{assoc.followers}</p>
                      <p className="text-[10px] text-slate-500">{assoc.posts} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Row 4: Reports per hub bar */}
        <ChartCard title="Open Moderation Reports per Hub">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hubActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Open Reports']} labelFormatter={(l, p) => p[0]?.payload?.fullName || l} />
              <Bar dataKey="Reports" fill={ROSE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* TrendingUp indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Data reflects current database state. Hub activity covers the last 7 days. User registrations cover the last 6 months.
        </div>
      </div>
    </AdminLayout>
  );
}

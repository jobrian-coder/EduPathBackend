import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useToast } from '../hooks/useToast';
import {
  Users,
  Search,
  ShieldOff,
  Shield,
  ExternalLink,
  MapPin,
  Mail,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
  BookOpen,
} from 'lucide-react';
import api, { type AdminAssociate } from '../../../services/api';

type SortKey = 'name' | 'followers' | 'posts' | 'strikes' | 'created_at';
type SortDir = 'asc' | 'desc';

const TYPE_COLORS: Record<string, string> = {
  MENTOR: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  SOCIETY: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SCHOOL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-500/20 text-emerald-300',
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  AWAITING_RESPONSE: 'bg-cyan-500/20 text-cyan-300',
  REJECTED: 'bg-red-500/20 text-red-300',
};

export default function AdminAssociates() {
  const [associates, setAssociates] = useState<AdminAssociate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'MENTOR' | 'SOCIETY' | 'SCHOOL'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'AWAITING_RESPONSE'>('');
  const [suspendedFilter, setSuspendedFilter] = useState<'' | 'active' | 'suspended'>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadAssociates();
  }, []);

  const loadAssociates = async () => {
    setLoading(true);
    try {
      const data = await api.adminManagement.listAllAssociates();
      setAssociates(data);
    } catch {
      addToast('Failed to load associates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (assoc: AdminAssociate) => {
    const action = assoc.is_suspended ? 'unsuspend' : 'suspend';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${assoc.name}?`)) return;
    setActionLoading(assoc.id);
    try {
      const res = await api.adminManagement.toggleSuspendAssociate(assoc.id);
      setAssociates(prev =>
        prev.map(a => (a.id === assoc.id ? { ...a, is_suspended: res.is_suspended } : a))
      );
      addToast(res.message, 'success');
    } catch {
      addToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const displayed = useMemo(() => {
    let list = [...associates];
    if (search) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.contact_email.toLowerCase().includes(search.toLowerCase()) || a.hub.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter(a => a.associate_type === typeFilter);
    if (statusFilter) list = list.filter(a => a.application_status === statusFilter);
    if (suspendedFilter === 'active') list = list.filter(a => !a.is_suspended);
    if (suspendedFilter === 'suspended') list = list.filter(a => a.is_suspended);
    list.sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === 'followers') { av = a.follower_count; bv = b.follower_count; }
      else if (sortKey === 'posts') { av = a.post_count; bv = b.post_count; }
      else if (sortKey === 'strikes') { av = a.strike_count; bv = b.strike_count; }
      else if (sortKey === 'created_at') { av = a.created_at; bv = b.created_at; }
      else { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [associates, search, typeFilter, statusFilter, suspendedFilter, sortKey, sortDir]);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className="flex items-center gap-1 hover:text-white transition-colors">
      {label}
      {sortKey === k ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <span className="w-3 h-3" />}
    </button>
  );

  const stats = useMemo(() => ({
    total: associates.length,
    verified: associates.filter(a => a.is_verified).length,
    suspended: associates.filter(a => a.is_suspended).length,
    mentors: associates.filter(a => a.associate_type === 'MENTOR' && a.is_verified).length,
    societies: associates.filter(a => a.associate_type === 'SOCIETY' && a.is_verified).length,
    schools: associates.filter(a => a.associate_type === 'SCHOOL' && a.is_verified).length,
  }), [associates]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Associates</h1>
            <p className="text-slate-400 text-sm mt-1">Manage all platform associates — mentors, societies, and schools</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'from-slate-700 to-slate-800' },
            { label: 'Verified', value: stats.verified, color: 'from-teal-900/60 to-teal-800/40' },
            { label: 'Suspended', value: stats.suspended, color: 'from-red-900/50 to-red-800/30' },
            { label: 'Mentors', value: stats.mentors, color: 'from-violet-900/50 to-violet-800/30' },
            { label: 'Societies', value: stats.societies, color: 'from-blue-900/50 to-blue-800/30' },
            { label: 'Schools', value: stats.schools, color: 'from-amber-900/50 to-amber-800/30' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl border border-slate-700/50 p-4`}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or hub…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option value="">All types</option>
              <option value="MENTOR">Mentor</option>
              <option value="SOCIETY">Society</option>
              <option value="SCHOOL">School</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option value="">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select value={suspendedFilter} onChange={e => setSuspendedFilter(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option value="">Active + Suspended</option>
              <option value="active">Active only</option>
              <option value="suspended">Suspended only</option>
            </select>
            {(search || typeFilter || statusFilter || suspendedFilter) && (
              <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setSuspendedFilter(''); }}
                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:border-teal-500 hover:text-teal-300 transition-colors">
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">{displayed.length} of {associates.length} associates</p>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No associates match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium"><SortBtn k="name" label="Associate" /></th>
                    <th className="text-left px-4 py-3 font-medium">Hub</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium"><SortBtn k="followers" label="Followers" /></th>
                    <th className="text-right px-4 py-3 font-medium"><SortBtn k="posts" label="Posts" /></th>
                    <th className="text-right px-4 py-3 font-medium"><SortBtn k="strikes" label="Strikes" /></th>
                    <th className="text-left px-4 py-3 font-medium"><SortBtn k="created_at" label="Joined" /></th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {displayed.map(assoc => (
                    <>
                      <tr
                        key={assoc.id}
                        onClick={() => setExpandedId(expandedId === assoc.id ? null : assoc.id)}
                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${assoc.is_suspended ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {assoc.profile_image ? (
                              <img src={assoc.profile_image} alt={assoc.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {assoc.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-white truncate">{assoc.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[assoc.associate_type] || 'bg-slate-700 text-slate-300'}`}>
                                  {assoc.associate_type.charAt(0) + assoc.associate_type.slice(1).toLowerCase()}
                                </span>
                                {assoc.is_suspended && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-700/50">Suspended</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{assoc.hub}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[assoc.application_status] || 'bg-slate-700 text-slate-300'}`}>
                            {assoc.application_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{assoc.follower_count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{assoc.post_count}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${assoc.strike_count >= 3 ? 'text-red-400' : assoc.strike_count >= 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {assoc.strike_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(assoc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleSuspend(assoc)}
                            disabled={actionLoading === assoc.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto ${
                              assoc.is_suspended
                                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                                : 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
                            } disabled:opacity-50`}
                          >
                            {actionLoading === assoc.id ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : assoc.is_suspended ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <ShieldOff className="w-3 h-3" />
                            )}
                            {assoc.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedId === assoc.id && (
                        <tr key={`${assoc.id}-detail`} className="bg-slate-800/30">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Contact</p>
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Mail className="w-4 h-4 text-slate-500" />
                                  <a href={`mailto:${assoc.contact_email}`} className="hover:text-teal-300 transition-colors">{assoc.contact_email}</a>
                                </div>
                                {assoc.location && (
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                    <span>{assoc.location}</span>
                                  </div>
                                )}
                                {assoc.website && (
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <ExternalLink className="w-4 h-4 text-slate-500" />
                                    <a href={assoc.website} target="_blank" rel="noopener noreferrer" className="hover:text-teal-300 transition-colors truncate">{assoc.website}</a>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Activity</p>
                                <div className="flex items-center gap-2 text-slate-300"><Star className="w-4 h-4 text-teal-400" /><span>{assoc.follower_count} followers</span></div>
                                <div className="flex items-center gap-2 text-slate-300"><BookOpen className="w-4 h-4 text-teal-400" /><span>{assoc.post_count} posts published</span></div>
                                {assoc.strike_count > 0 && (
                                  <div className="flex items-center gap-2 text-amber-300"><AlertTriangle className="w-4 h-4" /><span>{assoc.strike_count} strike{assoc.strike_count !== 1 ? 's' : ''}</span></div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Admin info</p>
                                <p className="text-slate-300">Verified: <span className={assoc.is_verified ? 'text-emerald-300' : 'text-red-300'}>{assoc.is_verified ? 'Yes' : 'No'}</span></p>
                                <p className="text-slate-300">Suspended: <span className={assoc.is_suspended ? 'text-red-300' : 'text-slate-400'}>{assoc.is_suspended ? 'Yes' : 'No'}</span></p>
                                <p className="text-slate-400 text-xs">Joined {new Date(assoc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

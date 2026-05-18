import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useToast } from '../hooks/useToast';
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Activity,
  ArrowRight,
  Plus,
  BookOpen,
  School,
  MapPin,
  Calendar,
  Mail
} from 'lucide-react';
import api, { type User } from '../../../services/api';

interface DashboardStats {
  totalCourses: number;
  totalUniversities: number;
  totalUsers: number;
}

const ROLE_COLORS: Record<string, string> = {
  novice: 'bg-gray-500/20 text-gray-400',
  contributor: 'bg-blue-500/20 text-blue-400',
  expert: 'bg-purple-500/20 text-purple-400',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalUniversities: 0,
    totalUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes, universitiesRes, usersRes] = await Promise.all([
          api.admin.listCourses(),
          api.admin.listUniversities(),
          api.admin.listUsers(),
        ]);
        
        setStats({
          totalCourses: coursesRes.count ?? coursesRes.results?.length ?? 0,
          totalUniversities: universitiesRes.count ?? universitiesRes.results?.length ?? 0,
          totalUsers: usersRes.count ?? usersRes.results?.length ?? 0,
        });
        setRecentUsers(usersRes.results.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        addToast('Failed to load dashboard stats', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [addToast]);

  const navCards = [
    { 
      title: 'Courses',
      description: 'Manage courses, programs, and academic offerings',
      icon: GraduationCap,
      count: stats.totalCourses,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-500/20',
      iconColor: 'text-teal-400',
      link: '/admin/courses',
      actions: [
        { label: 'View All', href: '/admin/courses' },
        { label: 'Add New', href: '/admin/courses', state: 'openModal' },
      ]
    },
    { 
      title: 'Universities',
      description: 'Manage universities and institutions',
      icon: Building2,
      count: stats.totalUniversities,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      link: '/admin/universities',
      actions: [
        { label: 'View All', href: '/admin/universities' },
        { label: 'Add New', href: '/admin/universities', state: 'openModal' },
      ]
    },
    { 
      title: 'Users',
      description: 'Manage users and their roles',
      icon: Users,
      count: stats.totalUsers,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      link: '/admin/users',
      actions: [
        { label: 'View All', href: '/admin/users' },
        { label: 'Add User', href: '/admin/users', state: 'openModal' },
      ]
    },
  ];

  const quickActions = [
    { 
      label: 'Add Course', 
      icon: BookOpen,
      href: '/admin/courses',
      color: 'teal'
    },
    { 
      label: 'Add University', 
      icon: School,
      href: '/admin/universities',
      color: 'purple'
    },
    { 
      label: 'Add User', 
      icon: Plus,
      href: '/admin/users',
      color: 'blue'
    },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage your EduPath content from one place</p>
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-3 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colorClasses = {
            teal: 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30',
            purple: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
            blue: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
          }[action.color];
          
          return (
            <a
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${colorClasses}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </a>
          );
        })}
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <span className="text-3xl font-bold text-white">
                  {loading ? '-' : card.count.toLocaleString()}
                </span>
              </div>
              
              <h2 className="text-lg font-semibold text-white mb-2">{card.title}</h2>
              <p className="text-sm text-slate-400 mb-4">{card.description}</p>
              
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <a
                  href={card.link}
                  className="flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Manage
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      <div className="mb-8 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
          </div>
          <a
            href="/admin/users"
            className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-slate-400">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading users…</span>
          </div>
        ) : recentUsers.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentUsers.map((user) => {
                  const joined = user.date_joined ?? user.created_at;
                  const initials = (user.first_name?.[0] ?? user.username[0]).toUpperCase();
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-white">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user.username}</p>
                            {(user.first_name || user.last_name) && (
                              <p className="text-xs text-slate-500">{user.first_name} {user.last_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {user.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {user.location || <span className="text-slate-600">—</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[user.role] ?? 'bg-slate-700 text-slate-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {new Date(joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-semibold text-white">System Status</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
            <span className="text-slate-400">API Status</span>
            <span className="flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
            <span className="text-slate-400">Database</span>
            <span className="flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
            <span className="text-slate-400">Last Sync</span>
            <span className="text-slate-300">Just now</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

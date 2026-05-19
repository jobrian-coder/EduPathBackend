import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Building2, 
  Users, 
  ShieldCheck,
  FileText,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.is_staff && !user.is_superuser) {
      navigate('/');
    }
  }, [user, navigate]);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/hubs/moderate', icon: ShieldCheck, label: 'Hub Moderation' },
    { path: '/admin/associates/applications', icon: FileText, label: 'Applications' },
    { path: '/admin/courses', icon: GraduationCap, label: 'Courses' },
    { path: '/admin/universities', icon: Building2, label: 'Universities' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!user || (!user.is_staff && !user.is_superuser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-6">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You need superuser or staff privileges to access the EduPath admin area.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-500"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">EduPath Admin</h1>
              <p className="text-xs text-slate-400">Superuser control panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-300 border-teal-500/30 shadow-sm shadow-teal-500/5' 
                    : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user.first_name?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-teal-400">
                Superuser access
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-950 to-teal-950/20">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

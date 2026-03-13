import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Settings, LogOut, ShieldAlert, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { User } from '../types';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Superadmin', 'Broker Staff', 'Supervisor'] },
    { name: 'Claims', path: '/claims', icon: FileText, roles: ['Superadmin', 'Broker Staff', 'Supervisor'] },
    { name: 'New Claim', path: '/claims/new', icon: PlusCircle, roles: ['Superadmin', 'Broker Staff'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['Superadmin', 'Supervisor'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['Superadmin'] },
  ].filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const pageTitle = location.pathname.split('/')[1] || 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
          <div className="bg-indigo-500 p-1.5 rounded-md shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">BCI Claim</h1>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <Icon className={clsx("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-semibold border border-indigo-500/30">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800 capitalize tracking-tight">
            {pageTitle.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

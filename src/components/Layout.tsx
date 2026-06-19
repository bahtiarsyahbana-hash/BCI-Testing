import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Settings, LogOut, ShieldCheck, Bell } from 'lucide-react';
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      {/* Sidebar */}
      <div className="z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300 shadow-sm">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="rounded-md bg-cyan-500 p-1.5 text-slate-950 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">BCI Claim</h1>
            <p className="text-xs font-medium text-slate-400">Control Center</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                  'flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100 shadow-sm' 
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={clsx("w-4 h-4", isActive ? "text-cyan-300" : "text-slate-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-100"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="glass sticky top-0 z-10 flex h-16 items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800 capitalize tracking-tight">
            {pageTitle.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <button className="relative rounded-md border border-slate-200 p-2 text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-cyan-700">
              <Bell className="w-5 h-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500 shadow-sm"></span>
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

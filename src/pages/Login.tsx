import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let user = null;
    if (email === 'admin@broker.com') {
      user = { id: 1, name: 'System Admin', email, role: 'Superadmin' };
    } else if (email === 'staff@broker.com') {
      user = { id: 2, name: 'Broker Staff', email, role: 'Broker Staff' };
    } else if (email === 'supervisor@broker.com') {
      user = { id: 3, name: 'Claim Supervisor', email, role: 'Supervisor' };
    } else {
      setError('Invalid credentials. Please use one of the demo accounts.');
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-3xl mix-blend-multiply" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-500/30">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/60">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all text-slate-900"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm shadow-indigo-200 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Sign in
              </button>
            </div>
          </form>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500 font-medium">Demo Credentials</span>
              </div>
            </div>
            <div className="mt-6 text-sm text-slate-600 space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => { setEmail('admin@broker.com'); setPassword('password123'); }}>
                <p className="font-bold text-slate-800 mb-0.5">Superadmin</p>
                <p className="font-mono text-xs text-slate-500">admin@broker.com / password123</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => { setEmail('staff@broker.com'); setPassword('password123'); }}>
                <p className="font-bold text-slate-800 mb-0.5">Broker Staff</p>
                <p className="font-mono text-xs text-slate-500">staff@broker.com / password123</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => { setEmail('supervisor@broker.com'); setPassword('password123'); }}>
                <p className="font-bold text-slate-800 mb-0.5">Supervisor</p>
                <p className="font-mono text-xs text-slate-500">supervisor@broker.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

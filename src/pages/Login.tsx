import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.user) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to sign in right now.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.7fr)]">
      <section className="hidden lg:flex flex-col justify-between bg-slate-950 px-12 py-10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">BCI Claims</p>
            <h1 className="text-2xl font-bold tracking-tight">Broker Control Center</h1>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Claims desk</p>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Track every claim, handoff, and settlement from one workspace.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Review active exposure, coordinate document follow-ups, and keep broker, insured, and insurer activity visible.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          <div>
            <p className="text-3xl font-bold text-white">24/7</p>
            <p className="mt-1 text-sm text-slate-400">Claim visibility</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">Live</p>
            <p className="mt-1 text-sm text-slate-400">Status tracking</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">Secure</p>
            <p className="mt-1 text-sm text-slate-400">Role access</p>
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-cyan-300 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">BCI Claims</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Broker Control Center</h1>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">Use your assigned broker account to continue.</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
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
                  className="block w-full rounded-md border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
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
                  className="block w-full rounded-md border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-cyan-700 hover:text-cyan-800 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-100"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Access is limited to authorized users.
          </p>
        </div>
      </main>
    </div>
  );
}

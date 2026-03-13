import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Database, Settings as SettingsIcon, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { User } from '../types';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user?.role !== 'Superadmin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const sections = [
    {
      title: 'User Management',
      icon: Users,
      description: 'Manage broker staff, supervisors, and their access levels.',
      action: 'Manage Users'
    },
    {
      title: 'Role & Permissions',
      icon: Shield,
      description: 'Configure role-based access control (RBAC) for the system.',
      action: 'Configure Roles'
    },
    {
      title: 'Claim Categories',
      icon: Database,
      description: 'Add or modify insurance types (e.g., Marine Cargo, Property, Health).',
      action: 'Edit Categories'
    },
    {
      title: 'System Configuration',
      icon: SettingsIcon,
      description: 'General settings, email templates, and notification preferences.',
      action: 'System Settings'
    }
  ];

  if (user?.role !== 'Superadmin') return null;

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      setMessage({ type: 'success', text: 'Database has been reset successfully.' });
      setShowResetModal(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Failed to reset database', error);
      setMessage({ type: 'error', text: 'Failed to reset database.' });
      setShowResetModal(false);
    } finally {
      setResetting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col items-start transition-all hover:shadow-md">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-5 border border-indigo-100">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 tracking-tight">{section.title}</h3>
              <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">{section.description}</p>
              
              <button className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm">
                {section.action}
              </button>
            </div>
          );
        })}

        {/* Danger Zone */}
        <div className="bg-rose-50/50 rounded-2xl shadow-sm border border-rose-200/60 p-6 flex flex-col items-start md:col-span-2 mt-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl mb-5 border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-rose-800 mb-2 tracking-tight">Danger Zone</h3>
          <p className="text-sm text-rose-600/80 mb-6 flex-1 leading-relaxed">
            Permanently delete all claims, activities, and documents from the database. This action cannot be undone.
          </p>
          
          <button 
            onClick={() => setShowResetModal(true)}
            disabled={resetting}
            className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors text-sm disabled:opacity-50 shadow-sm shadow-rose-200"
          >
            {resetting ? 'Resetting...' : 'Reset Database'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Database</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              WARNING: This will delete ALL claims, activities, and documents. This action cannot be undone. Are you absolutely sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={resetting}
                className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-medium transition-colors shadow-sm shadow-rose-200 disabled:opacity-70 flex items-center gap-2"
              >
                {resetting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Yes, Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={clsx(
            "px-5 py-3.5 rounded-xl shadow-xl font-medium flex items-center gap-3 border",
            message.type === 'success' ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-rose-200 text-rose-800"
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}

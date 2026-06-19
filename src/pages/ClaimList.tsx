import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, AlertCircle, Trash2, CheckCircle2, Plus, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { clsx } from 'clsx';
import { Claim, User } from '../types';

export default function ClaimList() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [insuranceTypeFilter, setInsuranceTypeFilter] = useState('All');
  const [labelFilter, setLabelFilter] = useState('All');
  
  const insuranceTypes = ['Marine Cargo', 'Property', 'Liability', 'Motor Vehicle', 'Health', 'Personal Accident', 'Travel', 'Others'];
  
  const [claimToDelete, setClaimToDelete] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  const isSupervisor = user?.role === 'Supervisor';
  const isSuperadmin = user?.role === 'Superadmin';

  useEffect(() => {
    if (location.state?.message) {
      setMessage({ type: 'success', text: location.state.message });
      navigate(location.pathname, { replace: true });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [location, navigate]);

  useEffect(() => {
    fetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClaims(data);
        } else {
          console.error('Failed to fetch claims or invalid response:', data);
          setClaims([]);
          if (data && data.error) {
            setMessage({ type: 'error', text: `Failed to load claims: ${data.error}` });
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setClaims([]);
        setLoading(false);
        setMessage({ type: 'error', text: 'Error loading claims' });
      });
  }, []);

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'On Insurer': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'On Broker': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'On Insured': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Settled': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Closed/Cancel': return 'text-slate-700 bg-slate-100 border-slate-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
    const matchesType = insuranceTypeFilter === 'All' || claim.insurance_type === insuranceTypeFilter;
    
    const matchesLabel = labelFilter === 'All' || claim.label === labelFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesLabel;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Claim Registered': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Document Pending': return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Under Assessment': return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'Under Insurer Review': return 'bg-cyan-50 text-cyan-800 border-cyan-300';
      case 'Claim Approved': return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Claim Settled': return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'Claim Rejected': return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'Claim Closed': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusAccent = (status: string) => {
    switch (status) {
      case 'Document Pending': return 'bg-amber-400';
      case 'Under Assessment': return 'bg-sky-500';
      case 'Under Insurer Review': return 'bg-cyan-500';
      case 'Claim Approved': return 'bg-emerald-500';
      case 'Claim Settled': return 'bg-teal-500';
      case 'Claim Rejected': return 'bg-rose-500';
      case 'Claim Closed': return 'bg-slate-400';
      default: return 'bg-slate-500';
    }
  };

  const handleDelete = (id: number) => {
    setClaimToDelete(id);
  };

  const confirmDelete = async () => {
    if (claimToDelete === null) return;
    try {
      const res = await fetch(`/api/claims/${claimToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setClaims(claims.filter(c => c.id !== claimToDelete));
        setMessage({ type: 'success', text: 'Claim successfully deleted' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete claim' });
      }
    } catch (error) {
      console.error('Failed to delete claim', error);
      setMessage({ type: 'error', text: 'Failed to delete claim' });
    }
    setClaimToDelete(null);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-4">
        <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search claims, clients, policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 sm:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Claim Registered">Claim Registered</option>
              <option value="Document Pending">Document Pending</option>
              <option value="Under Assessment">Under Assessment</option>
              <option value="Under Insurer Review">Under Insurer Review</option>
              <option value="Claim Approved">Claim Approved</option>
              <option value="Claim Settled">Claim Settled</option>
              <option value="Claim Rejected">Claim Rejected</option>
              <option value="Claim Closed">Claim Closed</option>
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={insuranceTypeFilter}
              onChange={(e) => setInsuranceTypeFilter(e.target.value)}
              className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 sm:w-auto"
            >
              <option value="All">All Types</option>
              {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 sm:w-auto"
            >
              <option value="All">All Label</option>
              <option value="On Insurer">On Insurer</option>
              <option value="On Broker">On Broker</option>
              <option value="On Insured">On Insured</option>
              <option value="Settled">Settled</option>
              <option value="Closed/Cancel">Closed/Cancel</option>
            </select>
          </div>
        </div>
        {!isSupervisor && (
          <Link
            to="/claims/new"
            className="flex items-center gap-2 rounded-md border border-slate-900 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Claims Register</p>
            <p className="text-xs text-slate-500">{filteredClaims.length} visible of {claims.length} claims</p>
          </div>
          <div className="hidden text-xs font-medium text-slate-500 sm:block">
            Sorted by latest claim first
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="w-3 px-0 py-4"></th>
                <th className="border-r border-slate-200 px-5 py-4">Claim Register Number</th>
                <th className="border-r border-slate-200 px-5 py-4">Client & Policy</th>
                <th className="border-r border-slate-200 px-5 py-4">Insurance Info</th>
                <th className="border-r border-slate-200 px-5 py-4">Amount</th>
                <th className="border-r border-slate-200 px-5 py-4">Status & Label</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredClaims.map((claim) => {
                const labelColor = getLabelColor(claim.label || 'On Broker');
                
                return (
                  <tr key={claim.id} className="group even:bg-slate-50/70 hover:bg-cyan-50/50 transition-colors duration-150">
                    <td className={clsx('w-3 px-0 py-0', getStatusAccent(claim.status))}></td>
                    <td className="border-r border-slate-200 px-5 py-4 align-top">
                      <Link to={`/claims/${claim.id}`} className="font-bold text-slate-950 hover:text-cyan-700">
                        {claim.claim_number}
                      </Link>
                      <div className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(claim.date_reported), 'dd MMM yyyy')}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Age: {Math.max(differenceInDays(new Date(), new Date(claim.date_reported)), 0)} days
                      </div>
                    </td>
                    <td className="border-r border-slate-200 px-5 py-4 align-top">
                      <div className="max-w-[280px] font-semibold leading-snug text-slate-900">{claim.client_name}</div>
                      <div className="mt-2 inline-block max-w-[300px] rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">
                        {claim.policy_number}
                      </div>
                    </td>
                    <td className="border-r border-slate-200 px-5 py-4 align-top">
                      <div className="text-sm font-medium text-slate-900">{claim.insurance_type}</div>
                      <div className="text-sm text-slate-500 mt-1">{claim.insurer_name}</div>
                    </td>
                    <td className="border-r border-slate-200 px-5 py-4 align-top">
                      <div className="font-semibold text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: claim.currency }).format(claim.claim_amount)}
                      </div>
                    </td>
                    <td className="border-r border-slate-200 px-5 py-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={clsx('rounded-md border px-2.5 py-1 text-xs font-bold', getStatusColor(claim.status))}>
                          {claim.status}
                        </span>
                        <span className={clsx('flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold', labelColor)}>
                          {claim.label || 'On Broker'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                          title="View Details"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                        {isSuperadmin && (
                          <button
                            onClick={() => handleDelete(claim.id)}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete Claim"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Search className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="text-base font-medium text-slate-900">No claims found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {claimToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100/80 flex items-center justify-center mb-4 border border-rose-200/50">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Claim</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">Are you sure you want to delete this claim? This action cannot be undone and will remove all associated documents and activities.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClaimToDelete(null)}
                className="px-5 py-2.5 text-slate-600 hover:bg-white/60 rounded-xl font-medium transition-colors border border-transparent hover:border-white/40"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-600/90 backdrop-blur-sm text-white hover:bg-rose-700 rounded-xl font-medium transition-all shadow-sm shadow-rose-200 border border-rose-500/50"
              >
                Yes, Delete Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={clsx(
            "px-5 py-3.5 rounded-xl shadow-xl font-medium flex items-center gap-3 backdrop-blur-md border",
            message.type === 'success' ? "bg-emerald-50/90 border-emerald-200/50 text-emerald-800" : "bg-rose-50/90 border-rose-200/50 text-rose-800"
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}

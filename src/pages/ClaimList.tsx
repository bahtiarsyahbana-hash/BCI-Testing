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
  const [agingFilter, setAgingFilter] = useState('All');
  
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
        setClaims(data);
        setLoading(false);
      });
  }, []);

  const getAgingStatus = (dateReported: string, status: string) => {
    if (['Claim Settled', 'Claim Closed', 'Claim Rejected'].includes(status)) return null;
    
    const days = differenceInDays(new Date(), new Date(dateReported));
    if (days > 90) return { label: 'Escalation', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (days > 30) return { label: 'Delayed', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (days > 7) return { label: 'In Progress', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    return { label: 'New', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
    const matchesType = insuranceTypeFilter === 'All' || claim.insurance_type === insuranceTypeFilter;
    
    const aging = getAgingStatus(claim.date_reported, claim.status);
    const agingLabel = aging ? aging.label : 'Completed';
    const matchesAging = agingFilter === 'All' || agingLabel === agingFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesAging;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Claim Registered': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Document Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Assessment': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Insurer Review': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Claim Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Claim Settled': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Claim Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Claim Closed': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search claims, clients, policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none text-sm font-medium text-slate-700 transition-all"
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
              className="w-full sm:w-auto pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none text-sm font-medium text-slate-700 transition-all"
            >
              <option value="All">All Types</option>
              {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none text-sm font-medium text-slate-700 transition-all"
            >
              <option value="All">All Aging</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Delayed">Delayed</option>
              <option value="Escalation">Escalation</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        {!isSupervisor && (
          <Link
            to="/claims/new"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 hover:shadow-md transition-all whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Claim Register Number</th>
                <th className="px-6 py-4">Client & Policy</th>
                <th className="px-6 py-4">Insurance Info</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status & Aging</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => {
                const aging = getAgingStatus(claim.date_reported, claim.status);
                
                return (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{claim.claim_number}</div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(claim.date_reported), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{claim.client_name}</div>
                      <div className="text-sm text-slate-500 mt-1 font-mono text-xs bg-slate-100 inline-block px-2 py-0.5 rounded">{claim.policy_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{claim.insurance_type}</div>
                      <div className="text-sm text-slate-500 mt-1">{claim.insurer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: claim.currency }).format(claim.claim_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={clsx('px-2.5 py-1 rounded-md text-xs font-semibold border', getStatusColor(claim.status))}>
                          {claim.status}
                        </span>
                        {aging && (
                          <span className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border', aging.color)}>
                            {aging.label === 'Escalation' && <AlertCircle className="w-3.5 h-3.5" />}
                            {aging.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                        {isSuperadmin && (
                          <button
                            onClick={() => handleDelete(claim.id)}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                      <Search className="w-8 h-8 mb-3 text-slate-300" />
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Claim</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Are you sure you want to delete this claim? This action cannot be undone and will remove all associated documents and activities.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClaimToDelete(null)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-medium transition-colors shadow-sm shadow-rose-200"
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

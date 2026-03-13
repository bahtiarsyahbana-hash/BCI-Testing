import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, Upload, MessageSquare, Clock, ArrowLeft, CheckCircle2, Trash2, AlertCircle, Building2, Calendar, DollarSign, Shield, Edit2, X, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Claim, Activity, Document, User } from '../types';

const currencies = ['USD', 'EUR', 'GBP', 'IDR', 'SGD'];

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  
  const [uploadType, setUploadType] = useState('Claim Form');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const [newNote, setNewNote] = useState('');

  const [claimToDelete, setClaimToDelete] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('');
  const [isSavingAmount, setIsSavingAmount] = useState(false);

  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  const canEdit = user?.role === 'Superadmin' || user?.role === 'Broker Staff';
  const isSuperadmin = user?.role === 'Superadmin';

  const fetchClaimData = () => {
    fetch(`/api/claims/${id}`)
      .then(res => res.json())
      .then(data => {
        setClaim(data.claim);
        setActivities(data.activities);
        setDocuments(data.documents);
        setNewStatus(data.claim.status);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaimData();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = { status: newStatus, notes: statusNote, user_id: user?.id };
    if (newStatus === 'Claim Approved' && settlementAmount) {
      payload.settlement_amount = Number(settlementAmount);
    }
    
    await fetch(`/api/claims/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setStatusNote('');
    setSettlementAmount('');
    fetchClaimData();
  };

  const handleUpdateAmount = async () => {
    if (!newAmount || isNaN(Number(newAmount))) return;
    setIsSavingAmount(true);
    try {
      const res = await fetch(`/api/claims/${id}/amount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_amount: Number(newAmount), currency: newCurrency, user_id: user?.id })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Claim amount updated successfully' });
        setIsEditingAmount(false);
        fetchClaimData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update claim amount' });
      }
    } catch (error) {
      console.error('Failed to update amount', error);
      setMessage({ type: 'error', text: 'Failed to update claim amount' });
    } finally {
      setIsSavingAmount(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('document_type', uploadType);

    await fetch(`/api/claims/${id}/documents`, {
      method: 'POST',
      body: formData
    });
    
    setUploadFile(null);
    fetchClaimData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote) return;

    await fetch(`/api/claims/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: 'Note Added', notes: newNote })
    });
    
    setNewNote('');
    fetchClaimData();
  };

  const handleDelete = () => {
    setClaimToDelete(true);
  };

  const confirmDeleteClaim = async () => {
    try {
      const res = await fetch(`/api/claims/${id}`, { method: 'DELETE' });
      if (res.ok) {
        navigate('/claims', { state: { message: 'Claim successfully deleted' } });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete claim' });
      }
    } catch (error) {
      console.error('Failed to delete claim', error);
      setMessage({ type: 'error', text: 'Failed to delete claim' });
    }
    setClaimToDelete(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteDocument = (docId: number) => {
    setDocToDelete(docId);
  };

  const confirmDeleteDocument = async () => {
    if (docToDelete === null) return;
    try {
      const res = await fetch(`/api/documents/${docToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClaimData();
        setMessage({ type: 'success', text: 'Document successfully deleted' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete document' });
      }
    } catch (error) {
      console.error('Failed to delete document', error);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
    setDocToDelete(null);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading || !claim) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading claim details...</p>
        </div>
      </div>
    );
  }

  const statuses = [
    'Claim Registered', 'Document Pending', 'Under Assessment', 
    'Under Insurer Review', 'Claim Approved', 'Claim Rejected', 
    'Claim Settled', 'Claim Closed'
  ];

  const docTypes = [
    'Claim Form', 'Invoice', 'Packing List', 'Bill of Lading', 
    'Survey Report', 'Photos', 'Police Report', 'Other Supporting Documents'
  ];

  const currentFlow = [
    'Claim Registered',
    'Document Pending',
    'Under Assessment',
    'Under Insurer Review',
    claim.status === 'Claim Rejected' ? 'Claim Rejected' : 'Claim Approved',
    'Claim Settled',
    'Claim Closed'
  ];
  
  const currentIndex = currentFlow.indexOf(claim.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <Link to="/claims" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Claim Register Number: {claim.claim_number}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{claim.client_name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{claim.policy_number}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isSuperadmin && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 overflow-x-auto">
        <div className="min-w-[700px] relative">
          <div className="flex items-center justify-between relative z-10">
            {currentFlow.map((status, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              const isRejected = status === 'Claim Rejected';

              return (
                <React.Fragment key={status}>
                  {/* Step */}
                  <div className="flex flex-col items-center relative group">
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white z-10",
                      isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "",
                      isCurrent && !isRejected ? "border-indigo-500 ring-4 ring-indigo-50 text-indigo-600" : "",
                      isCurrent && isRejected ? "border-rose-500 ring-4 ring-rose-50 text-rose-600" : "",
                      isFuture ? "border-slate-200 text-transparent" : ""
                    )}>
                      {isCompleted ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <div className={clsx("w-2.5 h-2.5 rounded-full", isRejected ? "bg-rose-500" : "bg-indigo-500")}></div>
                      ) : null}
                    </div>
                    
                    <span className={clsx(
                      "text-[11px] uppercase tracking-wider font-bold absolute top-12 w-28 text-center",
                      isCompleted ? "text-slate-700" : "",
                      isCurrent && !isRejected ? "text-indigo-600" : "",
                      isCurrent && isRejected ? "text-rose-600" : "",
                      isFuture ? "text-slate-400" : ""
                    )}>
                      {status}
                    </span>
                  </div>

                  {/* Connecting Line */}
                  {index < currentFlow.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 relative z-0">
                      <div className="absolute inset-0 bg-slate-200 rounded-full"></div>
                      <div className={clsx(
                        "absolute inset-0 rounded-full transition-all duration-500",
                        index < currentIndex ? "bg-emerald-500 w-full" : "w-0"
                      )}></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {/* Spacer for the absolute positioned labels */}
          <div className="h-8"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Updates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
              <FileText className="w-5 h-5 text-indigo-500" />
              Claim Information
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-slate-50 rounded-lg border border-slate-100 h-fit">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Insurance Type</p>
                  <p className="font-medium text-slate-900">{claim.insurance_type}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-slate-50 rounded-lg border border-slate-100 h-fit">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Insurer Name</p>
                  <p className="font-medium text-slate-900">{claim.insurer_name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-slate-50 rounded-lg border border-slate-100 h-fit">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date of Loss</p>
                  <p className="font-medium text-slate-900">{format(new Date(claim.date_of_loss), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-slate-50 rounded-lg border border-slate-100 h-fit">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date Reported</p>
                  <p className="font-medium text-slate-900">{format(new Date(claim.date_reported), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-indigo-50 rounded-lg border border-indigo-100 h-fit">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Claim Amount</p>
                  {isEditingAmount ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <select
                          value={newCurrency}
                          onChange={(e) => setNewCurrency(e.target.value)}
                          className="w-20 pl-2 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium appearance-none"
                        >
                          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="number"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleUpdateAmount}
                        disabled={isSavingAmount}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsEditingAmount(false)}
                        disabled={isSavingAmount}
                        className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-lg">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: claim.currency }).format(claim.claim_amount)}
                      </p>
                      {canEdit && !['Claim Settled', 'Claim Rejected', 'Claim Closed'].includes(claim.status) && (
                        <button
                          onClick={() => {
                            setNewAmount(claim.claim_amount.toString());
                            setNewCurrency(claim.currency);
                            setIsEditingAmount(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit Claim Amount"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 p-2 bg-emerald-50 rounded-lg border border-emerald-100 h-fit">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Settlement Amount</p>
                  <p className={clsx("font-bold text-lg", claim.settlement_amount ? "text-emerald-600" : "text-slate-400")}>
                    {claim.settlement_amount 
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: claim.currency }).format(claim.settlement_amount)
                      : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Update Status */}
          {canEdit && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Update Status
              </h3>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 transition-all"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {newStatus === 'Claim Approved' && (
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Settlement Amount"
                        value={settlementAmount}
                        onChange={(e) => setSettlementAmount(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                      />
                    </div>
                  )}
                  <div className="flex-[2]">
                    <input
                      type="text"
                      placeholder="Add a note (optional)"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 hover:shadow-md transition-all whitespace-nowrap text-sm"
                  >
                    Update Status
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
              <Upload className="w-5 h-5 text-blue-500" />
              Documents
            </h3>
            
            {/* Upload Form */}
            {canEdit && (
              <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-4 mb-6 items-end bg-slate-50/50 p-5 rounded-xl border border-slate-200/60">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Document Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 transition-all"
                  >
                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-[2] w-full">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!uploadFile}
                  className="w-full sm:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm h-[42px]"
                >
                  Upload
                </button>
              </form>
            )}

            {/* Document List */}
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200/60 rounded-xl hover:bg-slate-50/80 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{doc.document_type}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="truncate max-w-[200px]">{doc.filename}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{format(new Date(doc.upload_date), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View
                    </a>
                    {isSuperadmin && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-rose-600 hover:text-rose-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-slate-200/60 border-dashed">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">No documents yet</p>
                  <p className="text-xs text-slate-500 mt-1">Upload supporting documents for this claim.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-[calc(100vh-12rem)] sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
            <Clock className="w-5 h-5 text-amber-500" />
            Activity Log
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
            <div className="relative border-l-2 border-slate-100 ml-3.5 space-y-8 pb-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm" />
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-900 text-sm">{activity.activity}</span>
                    <span className="text-xs font-medium text-slate-400">{format(new Date(activity.date), 'dd MMM HH:mm')}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">{activity.notes}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                      {activity.user_name.charAt(0)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{activity.user_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canEdit && (
            <form onSubmit={handleAddNote} className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a quick note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!newNote}
                  className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Claim Deletion Modal */}
      {claimToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Claim</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Are you sure you want to delete this claim? This action cannot be undone and will remove all associated documents and activities.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClaimToDelete(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteClaim}
                className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-medium transition-colors shadow-sm shadow-rose-200"
              >
                Yes, Delete Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Deletion Modal */}
      {docToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Document</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocument}
                className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-medium transition-colors shadow-sm shadow-rose-200"
              >
                Yes, Delete Document
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

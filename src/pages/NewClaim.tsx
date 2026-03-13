import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { User } from '../types';

const insuranceTypes = ['Marine Cargo', 'Property', 'Liability', 'Motor Vehicle', 'Health', 'Personal Accident', 'Travel', 'Others'];
const currencies = ['USD', 'EUR', 'GBP', 'IDR', 'SGD'];
const insurers = [
  'PT Avrist General Insurance',
  'PT China Taiping Insurance Indonesia',
  'PT Asta Kanti Insurance Broker',
  'DSR Broker',
  'PT Malacca Trust Wuwungan Insurance Indonesia',
  'PT Asuransi Candi Utama',
  'Sunday Insurance Indonesia',
  'PT Asuransi Bintang, Tbk',
  'PT Asuransi Central Asia (ACA)',
  'PT Asuransi Multi Artha Guna Tbk (MAG)',
  'PT Asuransi Wahana Tata',
  'PT Adi Antara Asia Broker',
  'PT MNC Insurance',
  'Asuransi Sahabat',
  'PT Great Eastern General Insurance Indonesia',
  'PT Asuransi Astra Buana',
  'PT FPG Insurance Indonesia',
  'PT Asuransi AXA Indonesia',
  'PT Asuransi Zurich Indonesia',
  'PT Asuransi MAXIMUS',
  'PT Great Eastern Life Insurance Indonesia'
];

export default function NewClaim() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user?.role === 'Supervisor') {
      navigate('/claims');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    policy_number: '',
    insurance_type: insuranceTypes[0],
    insurer_name: insurers[0],
    date_of_loss: '',
    date_reported: new Date().toISOString().split('T')[0],
    claim_amount: '',
    currency: currencies[0],
    remarks: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          claim_amount: parseFloat(formData.claim_amount),
          user_id: user?.id
        })
      });
      
      if (!res.ok) {
        let errorMessage = 'Failed to create claim';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.id) {
        navigate(`/claims/${data.id}`);
      } else {
        throw new Error('No ID returned');
      }
    } catch (error: any) {
      console.error('Error creating claim:', error);
      alert(`Failed to register claim: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'Supervisor') return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Claim</h1>
        <button
          onClick={() => navigate('/claims')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Client & Policy Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 tracking-tight">Client & Policy Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Client Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="client_name"
                  required
                  value={formData.client_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Policy Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="policy_number"
                  required
                  value={formData.policy_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                  placeholder="e.g. POL-123456"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insurance Type <span className="text-rose-500">*</span></label>
                <select
                  name="insurance_type"
                  required
                  value={formData.insurance_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 transition-all"
                >
                  {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insurer Name <span className="text-rose-500">*</span></label>
                <select
                  name="insurer_name"
                  required
                  value={formData.insurer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 transition-all"
                >
                  <option value="" disabled>Select an insurer</option>
                  {insurers.map(insurer => <option key={insurer} value={insurer}>{insurer}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Claim Register Number */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 tracking-tight">Claim Register Number</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date of Loss <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  name="date_of_loss"
                  required
                  value={formData.date_of_loss}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date Reported <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  name="date_reported"
                  required
                  value={formData.date_reported}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Estimated Claim Amount <span className="text-rose-500">*</span></label>
                <div className="flex gap-2">
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 transition-all"
                  >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    name="claim_amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.claim_amount}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 tracking-tight">Additional Information</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remarks / Description</label>
              <textarea
                name="remarks"
                rows={4}
                value={formData.remarks}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none text-sm transition-all"
                placeholder="Brief description of the incident..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/claims')}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 hover:shadow-md transition-all disabled:opacity-70 text-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Registering...' : 'Register Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

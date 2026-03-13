import { useState } from 'react';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { Claim } from '../types';

export default function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    { name: 'Monthly Claim Summary', description: 'Overview of all claims registered and settled in the current month.' },
    { name: 'Claim Settlement Report', description: 'Detailed breakdown of settled claims, amounts, and turnaround times.' },
    { name: 'Claims by Client', description: 'Analysis of claims grouped by client/insured party.' },
    { name: 'Claims by Insurer', description: 'Performance and volume metrics grouped by insurance provider.' },
    { name: 'Claims by Insurance Type', description: 'Distribution of claims across Marine Cargo, Property, Liability, etc.' },
  ];

  const handleExportExcel = async (reportName: string) => {
    if (reportName !== 'Monthly Claim Summary') {
      alert('Export for this report is not yet implemented.');
      return;
    }

    setDownloading(reportName);
    try {
      const res = await fetch('/api/claims');
      const claims: Claim[] = await res.json();

      // Define CSV headers
      const headers = ['Claim Register Number', 'Insured Name', 'Insurer Name', 'Type Of Insurance', 'Date Of Loss', 'Date Of Report', 'Status', 'Amount'];
      
      // Map data to rows
      const rows = claims.map(claim => [
        claim.claim_number,
        claim.client_name,
        claim.insurer_name,
        claim.insurance_type,
        claim.date_of_loss,
        claim.date_reported,
        claim.status,
        `${claim.claim_amount} ${claim.currency}`
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Monthly_Claim_Summary_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full transition-all hover:shadow-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{report.name}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{report.description}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-5 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => handleExportExcel(report.name)}
                disabled={downloading === report.name}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm font-medium disabled:opacity-70"
              >
                {downloading === report.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Excel
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

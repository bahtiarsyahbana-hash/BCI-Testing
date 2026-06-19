import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, CheckCircle2, AlertTriangle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { DashboardData } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.metrics) {
          setData(data);
        } else {
          console.error('Failed to fetch dashboard data:', data);
          setData(null);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setData(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-slate-800">Failed to Load Dashboard</h2>
          <p className="text-slate-500 font-medium max-w-md">There was a problem connecting to the database. Please check your Supabase configuration or try again later.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Active Claims', value: data.metrics.totalActive, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100/50' },
    { title: 'Settled', value: data.metrics.settled, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' },
    { title: 'Under Review', value: data.metrics.underReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100/50' },
    { title: 'Delayed', value: data.metrics.delayed, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100/50' },
    { title: 'Rejected', value: data.metrics.rejected, icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-100/50', border: 'border-slate-200/50' },
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 tracking-wide">{stat.title}</h3>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.border} border backdrop-blur-sm`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-800 tracking-tight">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claim Label */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Claim Label Distribution</h3>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-indigo-50/40 border border-indigo-100/50 backdrop-blur-sm">
              <div className="text-sm font-medium text-indigo-600 mb-2">On Insurer</div>
              <div className="text-3xl font-bold text-indigo-900">{data.label.onInsurer}</div>
            </div>
            <div className="p-5 rounded-xl bg-amber-50/40 border border-amber-100/50 backdrop-blur-sm">
              <div className="text-sm font-medium text-amber-600 mb-2">On Broker</div>
              <div className="text-3xl font-bold text-amber-900">{data.label.onBroker}</div>
            </div>
            <div className="p-5 rounded-xl bg-blue-50/40 border border-blue-100/50 backdrop-blur-sm">
              <div className="text-sm font-medium text-blue-600 mb-2">On Insured</div>
              <div className="text-3xl font-bold text-blue-900">{data.label.onInsured}</div>
            </div>
            <div className="p-5 rounded-xl bg-emerald-50/40 border border-emerald-100/50 backdrop-blur-sm">
              <div className="text-sm font-medium text-emerald-600 mb-2">Settled</div>
              <div className="text-3xl font-bold text-emerald-900">{data.label.settled}</div>
            </div>
            <div className="p-5 rounded-xl bg-slate-50/40 border border-slate-200/50 backdrop-blur-sm col-span-2">
              <div className="text-sm font-medium text-slate-500 mb-2">Closed/Cancel</div>
              <div className="text-3xl font-bold text-slate-900">{data.label.closedCancel}</div>
            </div>
          </div>
        </div>

        {/* Claims by Status Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Claims by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.statusChart} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis type="number" tick={{fill: '#64748b', fontFamily: 'Sarabun'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 12, fill: '#475569', fontFamily: 'Sarabun'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claims by Insurance Type */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Claims by Insurance Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.typeChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.charts.typeChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', color: '#475569', fontFamily: 'Sarabun'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claims by Insurer */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Claims by Insurer</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.insurerChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b', fontFamily: 'Sarabun'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis tick={{fill: '#64748b', fontFamily: 'Sarabun'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)'}} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

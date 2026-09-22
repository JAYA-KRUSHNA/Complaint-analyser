import { useEffect, useState } from 'react';
import { dashboardApi } from '../lib/api';
import {
  BarChart3, TrendingUp, Brain, Layers, Zap, AlertTriangle, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../lib/api';

const COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#059669', '#ca8a04', '#ea580c', '#dc2626', '#7c3aed', '#db2777', '#6366f1', '#14b8a6', '#f59e0b'];

const glassTooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(226,232,240,0.4)',
  borderRadius: '14px',
  fontSize: '12px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
  padding: '8px 12px',
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<any[]>([]);
  const [models, setModels] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [statsRes, catRes, trendsRes, modelsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getByCategory(),
        api.get('/analytics/category-trends').catch(() => ({ data: [] })),
        api.get('/ml/models').catch(() => ({ data: { models: {} } })),
      ]);
      setStats(statsRes.data);
      setCategoryData(catRes.data);
      setCategoryTrends(trendsRes.data);
      setModels(modelsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-[3px] border-primary-100 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const priorityData = stats?.by_priority
    ? Object.entries(stats.by_priority).map(([key, value]) => {
        const map: Record<string, { label: string; color: string }> = {
          P1: { label: 'Critical', color: '#dc2626' },
          P2: { label: 'High', color: '#ea580c' },
          P3: { label: 'Medium', color: '#ca8a04' },
          P4: { label: 'Low', color: '#16a34a' },
        };
        return { name: map[key]?.label || key, value: value as number, fill: map[key]?.color || '#6b7280' };
      })
    : [];

  const statCards = [
    { label: 'Total Complaints', value: stats?.total || 0, icon: Layers, gradient: 'from-indigo-500 to-indigo-700', shadow: 'shadow-indigo-500/20' },
    { label: 'Avg Priority', value: stats?.avg_priority_score ? `${stats.avg_priority_score}` : '—', icon: Target, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
    { label: 'Active', value: stats?.pending || 0, icon: Zap, gradient: 'from-violet-500 to-purple-700', shadow: 'shadow-violet-500/20' },
    { label: 'Critical', value: stats?.critical_active || 0, icon: AlertTriangle, gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2 font-display">
          <BarChart3 className="w-5 h-5 text-primary-600" /> Analytics & Insights
        </h1>
        <p className="page-subtitle">AI-powered complaint analysis and system intelligence</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-civic-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-extrabold text-civic-800 mt-1.5 font-display">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg ${s.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-civic-800 mb-5 flex items-center gap-2 font-display">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Complaints by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.map((d) => ({ ...d, name: d.category, value: d.count }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    dataKey="value"
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="rgba(255,255,255,0.7)"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={glassTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categoryData.map((d, i) => (
                <div key={d.category} className="flex items-center gap-1.5 text-xs text-civic-600 bg-white/50 px-2.5 py-1 rounded-full border border-civic-200/40 font-medium">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.category} ({d.count})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Distribution */}
        {priorityData.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-civic-800 mb-5 flex items-center gap-2 font-display">
              <Zap className="w-4 h-4 text-orange-500" /> Priority Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barSize={44}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={glassTooltipStyle} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Category Trends Table */}
      {categoryTrends.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-civic-200/20">
            <h3 className="text-sm font-bold text-civic-800 flex items-center gap-2 font-display">
              <Brain className="w-4 h-4 text-purple-500" /> Category Intelligence
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-civic-200/20">
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Category</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Complaints</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Avg Priority</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Avg Severity</th>
                </tr>
              </thead>
              <tbody>
                {categoryTrends.map((cat: any) => (
                  <tr key={cat.category} className="border-b border-civic-100/30 hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-semibold text-civic-800">{cat.category}</td>
                    <td className="text-center px-4 py-3.5 text-sm text-civic-600 font-medium">{cat.total_complaints}</td>
                    <td className="text-center px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                        ${(cat.avg_priority_score || 0) >= 70 ? 'bg-red-50 text-red-700 ring-1 ring-red-200/60' :
                          (cat.avg_priority_score || 0) >= 40 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60' :
                          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'}`}>
                        {cat.avg_priority_score || '—'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3.5 text-sm text-civic-600 font-medium">{cat.avg_severity_score || '—'}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ML Models Status */}
      {models && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-civic-800 mb-5 flex items-center gap-2 font-display">
            <Brain className="w-4 h-4 text-violet-500" /> AI Models Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(models.models || {}).map(([key, m]: [string, any]) => (
              <div key={key} className="glass-accent p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-civic-800">{m.name}</h4>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    m.status === 'available' || m.status === 'always_available'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                      : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60'
                  }`}>
                    {m.status === 'always_available' ? 'Active' : m.status}
                  </span>
                </div>
                <p className="text-xs text-civic-400 font-medium">Version: {m.version}</p>
                {m.accuracy && (
                  <div className="mt-3 flex gap-6">
                    <div>
                      <p className="text-lg font-extrabold text-civic-800 font-display">{(m.accuracy * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-civic-400 uppercase font-bold tracking-wider">Accuracy</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-civic-800 font-display">{(m.f1_weighted * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-civic-400 uppercase font-bold tracking-wider">F1 Score</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

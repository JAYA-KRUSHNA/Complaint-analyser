import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, complaintsApi } from '../lib/api';
import {
  FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  ArrowUpRight, Layers, Zap, BarChart3, Plus,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

const CHART_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#059669', '#ca8a04', '#ea580c', '#dc2626', '#7c3aed', '#db2777', '#14b8a6', '#f59e0b', '#6366f1'];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  SUBMITTED: { color: 'text-blue-600', bg: 'bg-blue-50' },
  UNDER_REVIEW: { color: 'text-amber-600', bg: 'bg-amber-50' },
  IN_PROGRESS: { color: 'text-orange-600', bg: 'bg-orange-50' },
  RESOLVED: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  CLOSED: { color: 'text-slate-600', bg: 'bg-slate-50' },
  ESCALATED: { color: 'text-red-600', bg: 'bg-red-50' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        dashboardApi.getStats(),
        complaintsApi.list({ page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
      ]);
      setStats(statsRes.data);
      setRecentComplaints(complaintsRes.data.items);

      try {
        const catRes = await dashboardApi.getByCategory();
        setCategoryData(catRes.data);
      } catch { /* citizen may not have access */ }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
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

  const statCards = [
    { label: 'Total Complaints', value: stats?.total || 0, icon: Layers, gradient: 'from-primary-500 to-indigo-600', lightBg: 'bg-primary-50' },
    { label: 'Pending Review', value: stats?.pending || 0, icon: Clock, gradient: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50' },
    { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50' },
    { label: 'Critical', value: stats?.critical_active || 0, icon: AlertTriangle, gradient: 'from-red-500 to-rose-500', lightBg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-civic-900">
            Welcome back, <span className="text-primary-600">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-civic-500 mt-0.5">Here's an overview of your complaint activity</p>
        </div>
        <Link to="/complaints/new" className="btn-primary hidden sm:flex">
          <Plus className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statCards.map((s, i) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-civic-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-civic-800 mt-2">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-civic-200/30">
            <h3 className="text-sm font-semibold text-civic-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Recent Complaints
            </h3>
            <Link to="/complaints" className="text-xs text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-civic-300 mx-auto mb-3" />
              <p className="text-sm text-civic-500">No complaints filed yet</p>
              <Link to="/complaints/new" className="btn-primary btn-sm mt-4">
                <Plus className="w-3.5 h-3.5" /> File your first complaint
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-civic-100/40">
              {recentComplaints.map((c: any) => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.SUBMITTED;
                return (
                  <Link
                    key={c.id}
                    to={`/complaints/${c.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-civic-50/50 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-lg ${statusCfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${statusCfg.color}`}>
                        {c.complaint_number?.slice(-3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-civic-800 truncate group-hover:text-primary-700 transition-colors">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-civic-400">{c.complaint_number}</span>
                        {c.category_name && (
                          <>
                            <span className="text-civic-300">·</span>
                            <span className="text-[11px] text-civic-400">{c.category_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {c.priority_level && (
                        <span className={`priority-p${c.priority_level} text-[10px]`}>
                          P{c.priority_level}
                        </span>
                      )}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                        {c.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-civic-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> By Category
          </h3>

          {categoryData.length > 0 ? (
            <>
              <div className="h-48 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.map((d: any) => ({ name: d.category, value: d.count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      dataKey="value"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {categoryData.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(226,232,240,0.5)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {categoryData.slice(0, 5).map((d: any, i: number) => (
                  <div key={d.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                      <span className="text-xs text-civic-600">{d.category}</span>
                    </div>
                    <span className="text-xs font-semibold text-civic-800">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs text-civic-400">No category data</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        {[
          { label: 'File a Complaint', desc: 'Report a civic issue', icon: Plus, path: '/complaints/new', color: 'from-primary-500 to-indigo-600' },
          { label: 'View Complaints', desc: 'Track your submissions', icon: FileText, path: '/complaints', color: 'from-emerald-500 to-teal-500' },
          { label: 'Analytics', desc: 'View system insights', icon: TrendingUp, path: '/analytics', color: 'from-violet-500 to-purple-600' },
        ].map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="glass-card p-5 flex items-center gap-4 group hover:border-primary-200/40"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-civic-800 group-hover:text-primary-700 transition-colors">{action.label}</p>
              <p className="text-xs text-civic-400 mt-0.5">{action.desc}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-civic-300 ml-auto group-hover:text-primary-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

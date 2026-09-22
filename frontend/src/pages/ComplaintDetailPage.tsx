import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { getStatusBadge, formatDate, timeAgo } from '../lib/constants';
import {
  ArrowLeft, MapPin, Clock, Tag, Building2, Brain, Zap,
  AlertTriangle, Heart, Activity, Users, Info,
} from 'lucide-react';

// ─── Circular Gauge Component ──────────────────────────────────
function CircularGauge({ value, max, label, color, size = 100 }: {
  value: number; max: number; label: string; color: string; size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="gauge-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(226, 232, 240, 0.3)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-xl font-extrabold text-civic-800 font-display">{value}</p>
        <p className="text-[9px] text-civic-400 font-bold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── Severity/Level Badge ──────────────────────────────────────
function LevelBadge({ level, label }: { level: string; label: string }) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200/60' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200/60' },
    MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/60' },
    LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/60' },
    VERY_HIGH: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200/60' },
    VERY_LOW: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200/60' },
  };
  const cfg = colorMap[level] || { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200/60' };

  return (
    <div className="text-center">
      <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1.5">{label}</p>
      <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
        {level}
      </span>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  useAuth(); // reserved for future role-based actions
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadComplaint();
  }, [id]);

  async function loadComplaint() {
    try {
      const res = await complaintsApi.getById(id!);
      setComplaint(res.data);
    } catch (err) {
      console.error('Failed to load complaint:', err);
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

  if (!complaint) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-civic-700 font-display">Complaint not found</h2>
        <Link to="/complaints" className="btn-primary mt-4 inline-flex shadow-primary">Back to list</Link>
      </div>
    );
  }

  const statusInfo = getStatusBadge(complaint.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm text-civic-400 hover:text-civic-700 transition-colors font-medium group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to complaints
      </Link>

      {/* Header Card */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-sm font-mono text-civic-400">{complaint.complaint_number}</span>
              <span className={statusInfo.class}>{statusInfo.label}</span>
              {complaint.priority_level && (
                <span className={`priority-${complaint.priority_level.toLowerCase()}`}>
                  {complaint.priority_level}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-civic-900 font-display">{complaint.title}</h1>
          </div>
          <p className="text-sm text-civic-400 shrink-0 font-medium">{timeAgo(complaint.created_at)}</p>
        </div>

        <p className="mt-5 text-civic-600 leading-relaxed whitespace-pre-wrap text-[15px]">{complaint.description}</p>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-civic-100/50">
          {complaint.category_name && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-[11px] text-civic-400 font-semibold uppercase tracking-wider">Category</p>
                <p className="text-sm font-semibold text-civic-700 mt-0.5">{complaint.category_name}</p>
                {complaint.category_confidence && (
                  <p className="text-[11px] text-civic-400">{(complaint.category_confidence * 100).toFixed(0)}% confidence</p>
                )}
              </div>
            </div>
          )}

          {complaint.department_name && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[11px] text-civic-400 font-semibold uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-civic-700 mt-0.5">{complaint.department_name}</p>
              </div>
            </div>
          )}

          {(complaint.location_text || complaint.address) && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <p className="text-[11px] text-civic-400 font-semibold uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-civic-700 mt-0.5">{complaint.location_text || complaint.address}</p>
              </div>
            </div>
          )}

          {complaint.duration_hours != null && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] text-civic-400 font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-sm font-semibold text-civic-700 mt-0.5">
                  {complaint.duration_hours >= 24
                    ? `${Math.round(complaint.duration_hours / 24)} days`
                    : `${complaint.duration_hours} hours`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis — Visual Gauges */}
      {(complaint.severity_level || complaint.urgency_level || complaint.priority_score != null) && (
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-civic-800 mb-5 flex items-center gap-2 font-display">
            <Brain className="w-4 h-4 text-violet-500" /> AI Analysis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Severity */}
            {complaint.severity_level && (
              <div className="glass-accent p-5 rounded-xl">
                <div className="flex flex-col items-center">
                  {complaint.severity_score != null ? (
                    <div className="relative mb-2">
                      <CircularGauge
                        value={complaint.severity_score}
                        max={10}
                        label="/ 10"
                        color={complaint.severity_score >= 7 ? '#dc2626' : complaint.severity_score >= 4 ? '#f59e0b' : '#10b981'}
                        size={90}
                      />
                    </div>
                  ) : null}
                  <LevelBadge level={complaint.severity_level} label="Severity" />
                  {complaint.severity_confidence && (
                    <p className="text-[10px] text-civic-400 mt-1">
                      {(complaint.severity_confidence * 100).toFixed(0)}% confidence
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Urgency */}
            {complaint.urgency_level && (
              <div className="glass-accent p-5 rounded-xl">
                <div className="flex flex-col items-center">
                  <LevelBadge level={complaint.urgency_level} label="Urgency" />
                  {complaint.urgency_confidence && (
                    <p className="text-[10px] text-civic-400 mt-2">
                      {(complaint.urgency_confidence * 100).toFixed(0)}% confidence
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Priority Score */}
            {complaint.priority_score != null && (
              <div className="glass-accent p-5 rounded-xl">
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <CircularGauge
                      value={complaint.priority_score}
                      max={100}
                      label="/ 100"
                      color={complaint.priority_score >= 70 ? '#dc2626' : complaint.priority_score >= 40 ? '#f59e0b' : '#10b981'}
                      size={90}
                    />
                  </div>
                  <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold">Civic Impact Score</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Civic Impact Flags */}
      {(complaint.safety_risk_flag || complaint.essential_service_flag || complaint.vulnerable_population_flag) && (
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-civic-800 mb-4 flex items-center gap-2 font-display">
            <Activity className="w-4 h-4 text-orange-500" /> Civic Impact Factors
          </h2>
          <div className="flex flex-wrap gap-3">
            {complaint.safety_risk_flag && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200/50">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">Safety Risk</span>
              </div>
            )}
            {complaint.essential_service_flag && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200/50">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-700">Essential Service</span>
              </div>
            )}
            {complaint.vulnerable_population_flag && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200/50">
                <Heart className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700">Vulnerable Population</span>
              </div>
            )}
            {complaint.affected_population_estimate && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200/50">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-700">~{complaint.affected_population_estimate} affected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Priority Explanations (XAI) */}
      {complaint.priority_explanations?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-civic-800 mb-4 flex items-center gap-2 font-display">
            <Info className="w-4 h-4 text-indigo-500" /> Priority Score Breakdown
          </h2>
          <div className="space-y-3">
            {complaint.priority_explanations.map((exp: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-civic-50/50 hover:bg-civic-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-civic-700">{exp.factor}</p>
                  <p className="text-xs text-civic-400 mt-0.5">{exp.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-2 bg-civic-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.abs(exp.contribution) * 100, 100)}%`,
                        background: exp.contribution > 0 ? '#4f46e5' : '#94a3b8',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-civic-600 w-10 text-right">
                    {exp.contribution > 0 ? '+' : ''}{(exp.contribution * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Estimate */}
      {complaint.predicted_resolution_hours != null && (
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-civic-800 mb-3 flex items-center gap-2 font-display">
            <Clock className="w-4 h-4 text-sky-500" /> Estimated Resolution
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extrabold text-civic-800 font-display">
              {complaint.predicted_resolution_hours >= 24
                ? `${Math.round(complaint.predicted_resolution_hours / 24)} days`
                : `${Math.round(complaint.predicted_resolution_hours)} hours`}
            </div>
            {complaint.prediction_confidence && (
              <span className="text-xs text-civic-400 bg-civic-50 px-2.5 py-1 rounded-lg font-medium">
                {(complaint.prediction_confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      {complaint.status_history?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-civic-800 mb-5 flex items-center gap-2 font-display">
            <Clock className="w-4 h-4 text-sky-500" /> Status Timeline
          </h2>
          <div className="relative pl-7 space-y-5">
            <div className="absolute left-2.5 top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary-200 via-civic-200 to-transparent rounded-full" />
            {complaint.status_history.map((h: any) => {
              const hStatus = getStatusBadge(h.new_status);
              return (
                <div key={h.id} className="relative">
                  <div
                    className="absolute -left-[18px] top-1.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white shadow-sm"
                    style={{ backgroundColor: hStatus.color }}
                  />
                  <div className="ml-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={hStatus.class}>{hStatus.label}</span>
                      <span className="text-xs text-civic-400">{formatDate(h.created_at)}</span>
                    </div>
                    {h.comment && (
                      <p className="text-sm text-civic-600 mt-1.5">{h.comment}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

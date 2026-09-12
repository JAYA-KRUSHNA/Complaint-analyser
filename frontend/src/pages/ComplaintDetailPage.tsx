import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsApi } from '../lib/api';
import { getStatusBadge, formatDate, timeAgo } from '../lib/constants';
import { ArrowLeft, MapPin, Clock, Tag, Building2 } from 'lucide-react';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
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
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-civic-700">Complaint not found</h2>
        <Link to="/complaints" className="btn-primary mt-4 inline-flex">Back to list</Link>
      </div>
    );
  }

  const statusInfo = getStatusBadge(complaint.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm text-civic-500 hover:text-civic-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to complaints
      </Link>

      {/* Header Card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-civic-400">{complaint.complaint_number}</span>
              <span className={statusInfo.class}>{statusInfo.label}</span>
              {complaint.priority_level && (
                <span className={`priority-${complaint.priority_level.toLowerCase()}`}>
                  {complaint.priority_level}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-civic-900">{complaint.title}</h1>
          </div>
          <p className="text-sm text-civic-400 shrink-0">{timeAgo(complaint.created_at)}</p>
        </div>

        <p className="mt-4 text-civic-600 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-civic-100">
          {complaint.category_name && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-civic-400" />
              <div>
                <p className="text-xs text-civic-400">Category</p>
                <p className="text-sm font-medium text-civic-700">{complaint.category_name}</p>
                {complaint.category_confidence && (
                  <p className="text-xs text-civic-400">{(complaint.category_confidence * 100).toFixed(0)}% confidence</p>
                )}
              </div>
            </div>
          )}

          {complaint.department_name && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-civic-400" />
              <div>
                <p className="text-xs text-civic-400">Department</p>
                <p className="text-sm font-medium text-civic-700">{complaint.department_name}</p>
              </div>
            </div>
          )}

          {(complaint.location_text || complaint.address) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-civic-400" />
              <div>
                <p className="text-xs text-civic-400">Location</p>
                <p className="text-sm font-medium text-civic-700">{complaint.location_text || complaint.address}</p>
              </div>
            </div>
          )}

          {complaint.duration_hours != null && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-civic-400" />
              <div>
                <p className="text-xs text-civic-400">Duration</p>
                <p className="text-sm font-medium text-civic-700">
                  {complaint.duration_hours >= 24
                    ? `${Math.round(complaint.duration_hours / 24)} days`
                    : `${complaint.duration_hours} hours`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {(complaint.severity_level || complaint.urgency_level || complaint.priority_score != null) && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-civic-800 mb-4">AI Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {complaint.severity_level && (
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-civic-400 uppercase tracking-wider font-semibold">Severity</p>
                <p className="text-2xl font-bold text-civic-800 mt-1">{complaint.severity_level}</p>
                {complaint.severity_score && (
                  <p className="text-sm text-civic-500">{complaint.severity_score}/10</p>
                )}
              </div>
            )}
            {complaint.urgency_level && (
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-civic-400 uppercase tracking-wider font-semibold">Urgency</p>
                <p className="text-2xl font-bold text-civic-800 mt-1">{complaint.urgency_level}</p>
              </div>
            )}
            {complaint.priority_score != null && (
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-civic-400 uppercase tracking-wider font-semibold">Priority Score</p>
                <p className="text-2xl font-bold text-civic-800 mt-1">{complaint.priority_score}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      {complaint.status_history?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-civic-800 mb-4">Status Timeline</h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-civic-200" />
            {complaint.status_history.map((h: any) => {
              const hStatus = getStatusBadge(h.new_status);
              return (
                <div key={h.id} className="relative">
                  <div
                    className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: hStatus.color }}
                  />
                  <div className="ml-2">
                    <div className="flex items-center gap-2">
                      <span className={hStatus.class}>{hStatus.label}</span>
                      <span className="text-xs text-civic-400">{formatDate(h.created_at)}</span>
                    </div>
                    {h.comment && (
                      <p className="text-sm text-civic-600 mt-1">{h.comment}</p>
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

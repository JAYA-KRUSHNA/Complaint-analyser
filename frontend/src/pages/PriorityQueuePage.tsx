import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, complaintsApi } from '../lib/api';
import { getStatusBadge } from '../lib/constants';
import {
  Shield, AlertTriangle, Zap, ChevronLeft, ChevronRight,
  Filter, ArrowUpDown,
} from 'lucide-react';

export default function PriorityQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Status update modal
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [page, statusFilter, priorityFilter]);

  async function loadQueue() {
    setLoading(true);
    try {
      const params: any = { page, page_size: 15 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await dashboardApi.getPriorityQueue(params);
      setQueue(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!selectedComplaint || !newStatus) return;
    setUpdating(true);
    try {
      await complaintsApi.updateStatus(selectedComplaint.id, {
        status: newStatus,
        comment: statusComment || undefined,
      });
      setSelectedComplaint(null);
      setNewStatus('');
      setStatusComment('');
      loadQueue();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  const priorityColor = (level: string) => {
    const map: Record<string, string> = {
      P1: 'bg-red-600', P2: 'bg-orange-500', P3: 'bg-yellow-400', P4: 'bg-green-500',
    };
    return map[level] || 'bg-gray-400';
  };

  const priorityLabel = (level: string) => {
    const map: Record<string, string> = {
      P1: 'CRITICAL', P2: 'HIGH', P3: 'MEDIUM', P4: 'LOW',
    };
    return map[level] || level;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" /> Priority Queue
          </h1>
          <p className="page-subtitle">{total} complaints sorted by priority score</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-civic-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-civic-400" />
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 — Critical</option>
            <option value="P2">P2 — High</option>
            <option value="P3">P3 — Medium</option>
            <option value="P4">P4 — Low</option>
          </select>
        </div>
      </div>

      {/* Queue */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : queue.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield className="w-16 h-16 text-civic-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-civic-700">Queue empty</h3>
          <p className="text-civic-400 mt-1">No analyzed complaints match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            const statusInfo = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary-200 transition-all"
              >
                {/* Priority Badge */}
                <div className="flex items-center gap-3 sm:w-24 shrink-0">
                  <div className={`w-10 h-10 rounded-xl ${priorityColor(item.priority_level)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {item.priority_score}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-civic-500">{item.priority_level}</p>
                    <p className="text-[10px] text-civic-400 uppercase">{priorityLabel(item.priority_level)}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-civic-400">{item.complaint_number}</span>
                    <span className={statusInfo.class}>{statusInfo.label}</span>
                    {item.safety_risk && (
                      <span className="badge bg-red-100 text-red-600 border border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-0.5" /> Safety
                      </span>
                    )}
                    {item.essential_service && (
                      <span className="badge bg-blue-100 text-blue-600 border border-blue-200">
                        <Zap className="w-3 h-3 mr-0.5" /> Essential
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/complaints/${item.id}`}
                    className="text-sm font-medium text-civic-800 hover:text-primary-600 transition-colors"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-civic-400">
                    <span>{item.category_name || 'Uncategorized'}</span>
                    <span>•</span>
                    <span>{item.department_name || 'Unassigned'}</span>
                    <span>•</span>
                    <span>{item.severity_level}</span>
                    <span>•</span>
                    <span>{item.location_text || 'No location'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedComplaint(item)}
                    className="btn-secondary btn-sm"
                  >
                    Update Status
                  </button>
                  <Link
                    to={`/complaints/${item.id}`}
                    className="btn-ghost btn-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-civic-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary btn-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-civic-800 mb-1">Update Status</h3>
            <p className="text-sm text-civic-400 mb-4">{selectedComplaint.complaint_number} — {selectedComplaint.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="label">New Status</label>
                <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">Select status...</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="label">Comment (optional)</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Reason for status change..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedComplaint(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleStatusUpdate} disabled={!newStatus || updating} className="btn-primary flex-1">
                  {updating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

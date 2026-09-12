import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../lib/api';
import { getStatusBadge, formatDate } from '../lib/constants';
import { FileText, Plus, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ComplaintsListPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const pageSize = 10;

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter]);

  async function loadComplaints() {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize, sort_by: 'created_at', sort_order: 'desc' };
      if (statusFilter) params.status = statusFilter;
      const res = await complaintsApi.list(params);
      setComplaints(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }

  const statuses = ['', 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED', 'CLOSED'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">{total} total complaints</p>
        </div>
        <Link to="/complaints/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="w-4 h-4 text-civic-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {statuses.filter(Boolean).map((s) => (
              <option key={s} value={s}>{getStatusBadge(s).label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-civic-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-civic-700">No complaints found</h3>
          <p className="text-civic-400 mt-1">{statusFilter ? 'Try a different filter' : 'Submit your first complaint'}</p>
          <Link to="/complaints/new" className="btn-primary mt-6 inline-flex">
            <Plus className="w-4 h-4" /> Submit Complaint
          </Link>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-civic-50/50 border-b border-civic-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-civic-500 uppercase tracking-wider">Complaint</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-civic-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-civic-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-civic-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-civic-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-100">
                  {complaints.map((c) => {
                    const statusInfo = getStatusBadge(c.status);
                    return (
                      <tr key={c.id} className="hover:bg-civic-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/complaints/${c.id}`} className="group">
                            <span className="text-xs font-mono text-civic-400">{c.complaint_number}</span>
                            <p className="text-sm font-medium text-civic-800 group-hover:text-primary-600 transition-colors truncate max-w-xs">
                              {c.title}
                            </p>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-civic-600">{c.category_name || '—'}</td>
                        <td className="px-6 py-4"><span className={statusInfo.class}>{statusInfo.label}</span></td>
                        <td className="px-6 py-4">
                          {c.priority_level ? (
                            <span className={`priority-${c.priority_level.toLowerCase()}`}>{c.priority_level}</span>
                          ) : (
                            <span className="text-xs text-civic-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-civic-500">{formatDate(c.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-civic-100">
              {complaints.map((c) => {
                const statusInfo = getStatusBadge(c.status);
                return (
                  <Link key={c.id} to={`/complaints/${c.id}`} className="block px-4 py-4 hover:bg-civic-50/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-civic-400">{c.complaint_number}</span>
                      <span className={statusInfo.class}>{statusInfo.label}</span>
                    </div>
                    <p className="text-sm font-medium text-civic-800">{c.title}</p>
                    <p className="text-xs text-civic-400 mt-1">{c.category_name || '—'} • {formatDate(c.created_at)}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-civic-500">
                Page {page} of {totalPages} ({total} results)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary btn-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

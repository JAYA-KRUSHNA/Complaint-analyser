import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../lib/api';
import { getStatusBadge, formatDate, CATEGORIES } from '../lib/constants';
import { FileText, Plus, Filter, ChevronLeft, ChevronRight, Search, X, LayoutGrid, List } from 'lucide-react';
import { SkeletonTableRow, SkeletonComplaintCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function ComplaintsListPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const pageSize = 10;

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter, categoryFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadComplaints();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadComplaints() {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize, sort_by: 'created_at', sort_order: 'desc' };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery) params.search = searchQuery;
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
  const priorities = ['', 'P1', 'P2', 'P3', 'P4'];
  const hasFilters = statusFilter || categoryFilter || priorityFilter || searchQuery;

  const clearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title font-display">My Complaints</h1>
          <p className="page-subtitle">{total} total complaints</p>
        </div>
        <Link to="/complaints/new" className="btn-primary shadow-primary group">
          <Plus className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-civic-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or complaint number..."
            className="input pl-10 pr-10 py-2.5"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-civic-100 text-civic-400 hover:text-civic-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-civic-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-auto min-w-[130px]"
            >
              <option value="">All Statuses</option>
              {statuses.filter(Boolean).map((s) => (
                <option key={s} value={s}>{getStatusBadge(s).label}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-auto min-w-[140px]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-auto min-w-[120px]"
            >
              <option value="">All Priorities</option>
              {priorities.filter(Boolean).map((p) => (
                <option key={p} value={p}>{p} — {p === 'P1' ? 'Critical' : p === 'P2' ? 'High' : p === 'P3' ? 'Medium' : 'Low'}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="btn-ghost btn-sm text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="hidden md:flex items-center gap-1 bg-civic-100/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-civic-700' : 'text-civic-400 hover:text-civic-600'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-civic-700' : 'text-civic-400 hover:text-civic-600'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-civic-50/40 border-b border-civic-200/30">
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Complaint</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-civic-100/30">
                {[...Array(5)].map((_, i) => <SkeletonTableRow key={i} />)}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-civic-100/30">
            {[...Array(5)].map((_, i) => <SkeletonComplaintCard key={i} />)}
          </div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<FileText className="w-7 h-7" />}
            title={hasFilters ? 'No complaints match your filters' : 'No complaints found'}
            description={hasFilters ? 'Try adjusting your search or filter criteria' : 'Submit your first civic complaint to get started'}
            action={
              hasFilters ? (
                <button onClick={clearFilters} className="btn-secondary btn-sm">Clear Filters</button>
              ) : (
                <Link to="/complaints/new" className="btn-primary shadow-primary">
                  <Plus className="w-4 h-4" /> Submit Complaint
                </Link>
              )
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {complaints.map((c) => {
            const statusInfo = getStatusBadge(c.status);
            return (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="glass-card p-5 group hover:-translate-y-1"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-civic-400">{c.complaint_number}</span>
                  <span className={statusInfo.class}>{statusInfo.label}</span>
                </div>
                <p className="text-sm font-semibold text-civic-800 group-hover:text-primary-600 transition-colors line-clamp-2">
                  {c.title}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[11px] text-civic-400">{c.category_name || '—'}</span>
                  {c.priority_level && (
                    <>
                      <span className="text-civic-300">·</span>
                      <span className={`priority-${c.priority_level.toLowerCase()} text-[10px]`}>{c.priority_level}</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-civic-400 mt-2">{formatDate(c.created_at)}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List/Table View */
        <>
          <div className="glass-card overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-civic-50/40 border-b border-civic-200/30">
                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Complaint</th>
                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-civic-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-100/30">
                  {complaints.map((c) => {
                    const statusInfo = getStatusBadge(c.status);
                    return (
                      <tr key={c.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/complaints/${c.id}`} className="group">
                            <span className="text-[11px] font-mono text-civic-400">{c.complaint_number}</span>
                            <p className="text-sm font-semibold text-civic-800 group-hover:text-primary-600 transition-colors truncate max-w-xs">
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
            <div className="md:hidden divide-y divide-civic-100/30">
              {complaints.map((c) => {
                const statusInfo = getStatusBadge(c.status);
                return (
                  <Link key={c.id} to={`/complaints/${c.id}`} className="block px-4 py-4 hover:bg-indigo-50/20 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-civic-400">{c.complaint_number}</span>
                      <span className={statusInfo.class}>{statusInfo.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-civic-800">{c.title}</p>
                    <p className="text-xs text-civic-400 mt-1">{c.category_name || '—'} • {formatDate(c.created_at)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-civic-400 font-medium">
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
    </div>
  );
}

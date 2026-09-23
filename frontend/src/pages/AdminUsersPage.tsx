import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminApi } from '../lib/api';
import {
  Users, Search, Shield, ShieldCheck, UserCog, User,
  MoreVertical, Check, X, Trash2, ArrowUpDown,
  Mail, Phone, Calendar, Eye, EyeOff, ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  department_id?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: ShieldCheck },
  ADMIN: { label: 'Admin', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: Shield },
  DEPARTMENT_OFFICER: { label: 'Officer', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: UserCog },
  CITIZEN: { label: 'Citizen', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: User },
};

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_OFFICER', 'CITIZEN'];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Action states
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [roleChangeId, setRoleChangeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const pageSize = 15;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // ─── Fetch Users ────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.is_active = activeFilter === 'active';

      const res = await adminApi.listUsers(params);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err: any) {
      toast.error('Error', err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Actions ────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.changeRole(userId, newRole);
      toast.success('Role Updated', `User role changed to ${ROLE_CONFIG[newRole]?.label}`);
      setRoleChangeId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error('Error', err.response?.data?.detail || 'Failed to change role');
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      await adminApi.changeStatus(user.id, !user.is_active);
      toast.success(
        user.is_active ? 'User Deactivated' : 'User Activated',
        `${user.name}'s account has been ${user.is_active ? 'deactivated' : 'activated'}`
      );
      fetchUsers();
    } catch (err: any) {
      toast.error('Error', err.response?.data?.detail || 'Failed to change status');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId);
      toast.success('User Deleted', 'User has been permanently removed');
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error('Error', err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-civic-900 tracking-tight font-display flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            User Management
          </h1>
          <p className="text-civic-400 mt-1 text-sm">
            Manage users, assign roles, and control access — {total} total users
          </p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          const count = roleCounts[role] || 0;
          const isSelected = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => { setRoleFilter(isSelected ? '' : role); setPage(1); }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-300 bg-indigo-50 shadow-sm ring-1 ring-indigo-200'
                  : 'border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-lg ${config.bg} border`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-civic-800">{count}</p>
                <p className="text-[11px] font-semibold text-civic-400 uppercase tracking-wider">{config.label}s</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-civic-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-civic-700 focus:outline-none focus:border-indigo-300 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(roleFilter || activeFilter || search) && (
            <button
              onClick={() => { setRoleFilter(''); setActiveFilter(''); setSearchInput(''); setSearch(''); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-400 font-medium">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.CITIZEN;
                  const RoleIcon = roleConfig.icon;
                  const isCurrentUser = u.id === currentUser?.id;
                  const isMenuOpen = actionMenuId === u.id;
                  const isRoleEditing = roleChangeId === u.id;
                  const isDeleting = deleteConfirmId === u.id;

                  return (
                    <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                            u.is_active ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-civic-800 flex items-center gap-1.5">
                              {u.name}
                              {isCurrentUser && (
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">YOU</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {u.email}
                        </p>
                        {u.phone && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {u.phone}
                          </p>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        {isRoleEditing ? (
                          <div className="flex flex-col gap-1">
                            {ROLES.map((role) => {
                              const rc = ROLE_CONFIG[role];
                              const canAssign = isSuperAdmin || (!['SUPER_ADMIN', 'ADMIN'].includes(role));
                              return (
                                <button
                                  key={role}
                                  disabled={!canAssign || role === u.role}
                                  onClick={() => handleRoleChange(u.id, role)}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    role === u.role
                                      ? `${rc.bg} ${rc.color} border ring-1 ring-indigo-200`
                                      : canAssign
                                      ? 'hover:bg-slate-100 text-slate-600 border border-transparent'
                                      : 'text-slate-300 cursor-not-allowed border border-transparent'
                                  }`}
                                >
                                  {role === u.role && <Check className="w-3 h-3" />}
                                  {rc.label}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setRoleChangeId(null)}
                              className="text-xs text-slate-400 hover:text-slate-600 mt-1 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleConfig.bg} ${roleConfig.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig.label}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          u.is_active ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isCurrentUser ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase">—</span>
                        ) : isDeleting ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-500 font-semibold">Delete?</span>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActionMenuId(isMenuOpen ? null : u.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1.5 animate-scale-in">
                                  <button
                                    onClick={() => { setRoleChangeId(u.id); setActionMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                  >
                                    <ArrowUpDown className="w-3.5 h-3.5" /> Change Role
                                  </button>
                                  <button
                                    onClick={() => { handleToggleStatus(u); setActionMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                  >
                                    {u.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={() => { setDeleteConfirmId(u.id); setActionMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete User
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400 font-medium">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-white hover:border-slate-200 border border-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

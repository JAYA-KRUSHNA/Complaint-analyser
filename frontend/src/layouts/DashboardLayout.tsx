import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, FileText, Plus, LogOut, Menu, X,
  Shield, ChevronDown, BarChart3, ListChecks, ChevronLeft,
  Bell, Search,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOfficer = user?.role === 'DEPARTMENT_OFFICER';
  const isStaff = isAdmin || isOfficer;

  const navSections = [
    {
      label: 'Overview',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Complaints',
      items: [
        { path: '/complaints', label: 'All Complaints', icon: FileText },
        { path: '/complaints/new', label: 'New Complaint', icon: Plus },
      ],
    },
    ...(isStaff ? [{
      label: 'Administration',
      items: [
        { path: '/admin/queue', label: 'Priority Queue', icon: ListChecks },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-civic-50">
      {/* ─── Mobile Overlay ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 flex flex-col
          bg-sidebar-bg border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[252px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-[15px] font-bold text-white tracking-tight leading-none">CiviSense</h1>
              <p className="text-[9px] text-indigo-400/50 font-medium tracking-[0.2em] uppercase mt-0.5">AI Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-heading uppercase tracking-[0.15em]">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                        transition-all duration-150 group relative
                        ${active
                          ? 'bg-primary-600/15 text-primary-400'
                          : 'text-sidebar-text hover:text-white hover:bg-white/5'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />
                      )}
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-primary-400' : 'text-sidebar-text group-hover:text-white'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-white/5 text-sidebar-text hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User */}
        <div className={`border-t border-white/5 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? '' : 'px-2'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-sidebar-text truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Sign out"
                className="text-sidebar-text hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[252px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-civic-200/40 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-civic-100 text-civic-600 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Page breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-civic-400">
                {navSections.flatMap(s => s.items).find(i => isActive(i.path))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-civic-100/60 rounded-lg text-civic-400 text-sm w-52 hover:bg-civic-100 transition-colors cursor-pointer">
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-medium bg-white rounded px-1.5 py-0.5 border border-civic-200/60 text-civic-400">⌘K</kbd>
            </div>

            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-civic-100 text-civic-500 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Profile avatar (desktop) */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-civic-100 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-3 h-3 text-civic-400 hidden sm:block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-civic-200/50 py-1.5 animate-scale-in z-50">
                    <div className="px-4 py-2.5 border-b border-civic-100">
                      <p className="text-sm font-semibold text-civic-800">{user?.name}</p>
                      <p className="text-xs text-civic-400 mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 page-container animate-fade-in" onClick={() => setProfileOpen(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, FileText, Plus, LogOut, Menu, X,
  Shield, ChevronDown, BarChart3, ListChecks, ChevronLeft,
  Bell, Search, MapPin, Cpu, ArrowRight, Heart, Sparkles,
} from 'lucide-react';

// ─── Command Palette ───────────────────────────────────────────
function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'Navigation' },
    { label: 'All Complaints', path: '/complaints', icon: FileText, section: 'Navigation' },
    { label: 'New Complaint', path: '/complaints/new', icon: Plus, section: 'Navigation' },
    { label: 'Civic Map', path: '/map', icon: MapPin, section: 'Navigation' },
    { label: 'Priority Queue', path: '/admin/queue', icon: ListChecks, section: 'Admin' },
    { label: 'Analytics', path: '/analytics', icon: BarChart3, section: 'Admin' },
    { label: 'AI Research Lab', path: '/research', icon: Cpu, section: 'Admin' },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-civic-200/30">
          <Search className="w-4.5 h-4.5 text-civic-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 text-sm text-civic-800 placeholder:text-civic-400 bg-transparent outline-none font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0].path);
            }}
          />
          <kbd className="text-[10px] font-semibold bg-civic-100 rounded-md px-1.5 py-0.5 text-civic-400">ESC</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-civic-400">No results found</p>
            </div>
          ) : (
            <>
              {['Navigation', 'Admin'].map((section) => {
                const items = filtered.filter((c) => c.section === section);
                if (items.length === 0) return null;
                return (
                  <div key={section}>
                    <p className="px-4 py-1.5 text-[10px] font-bold text-civic-400 uppercase tracking-wider">{section}</p>
                    {items.map((cmd) => (
                      <button
                        key={cmd.path}
                        onClick={() => handleSelect(cmd.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/50 transition-colors text-left group"
                      >
                        <cmd.icon className="w-4 h-4 text-civic-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-sm font-medium text-civic-700 group-hover:text-civic-900 transition-colors">{cmd.label}</span>
                        <ArrowRight className="w-3 h-3 text-civic-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ───────────────────────────────────────────────
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOfficer = user?.role === 'DEPARTMENT_OFFICER';
  const isStaff = isAdmin || isOfficer;

  const navSections = [
    {
      label: 'Overview',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/map', label: 'Civic Map', icon: MapPin },
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
        { path: '/research', label: 'AI Research Lab', icon: Cpu },
      ],
    }] : []),
  ];

  // ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Breadcrumb
  const currentPage = navSections.flatMap((s) => s.items).find((i) => isActive(i.path));
  const currentSection = navSections.find((s) => s.items.some((i) => isActive(i.path)));

  return (
    <div className="min-h-screen flex bg-civic-50">
      {/* ─── Mobile Overlay ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Command Palette ───────────────────────────── */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* ─── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 flex flex-col
          bg-sidebar-bg border-r border-white/[0.04]
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[256px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/[0.04] ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-[15px] font-extrabold text-white tracking-tight leading-none font-display">CiviSense</h1>
              <p className="text-[9px] text-indigo-400/40 font-semibold tracking-[0.2em] uppercase mt-0.5">AI Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-2.5 text-[10px] font-bold text-sidebar-heading uppercase tracking-[0.16em]">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
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
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                        transition-all duration-200 group relative
                        ${active
                          ? 'bg-indigo-600/15 text-indigo-400 shadow-sm shadow-indigo-500/5'
                          : 'text-sidebar-text hover:text-white hover:bg-white/[0.06]'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500/30" />
                      )}
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'text-indigo-400' : 'text-sidebar-text group-hover:text-white'}`} />
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
          className="hidden lg:flex items-center justify-center h-10 border-t border-white/[0.04] text-sidebar-text hover:text-white hover:bg-white/[0.04] transition-all"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User */}
        <div className={`border-t border-white/[0.04] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? '' : 'px-2'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-indigo-500/20">
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
                className="text-sidebar-text hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[256px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/85 backdrop-blur-2xl border-b border-civic-200/30 flex items-center justify-between px-4 lg:px-6 shadow-sm shadow-slate-900/[0.02]">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-civic-100 text-civic-600 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              {currentSection && (
                <>
                  <span className="text-civic-300 font-medium text-xs">{currentSection.label}</span>
                  <ChevronLeft className="w-3 h-3 text-civic-300 rotate-180" />
                </>
              )}
              <span className="text-civic-500 font-semibold text-xs">
                {currentPage?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-2 bg-civic-50/80 rounded-xl text-civic-400 text-sm w-56 hover:bg-civic-100/80 transition-all cursor-pointer border border-civic-200/40"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Search...</span>
              <kbd className="ml-auto text-[10px] font-semibold bg-white rounded-md px-1.5 py-0.5 border border-civic-200/60 text-civic-400 shadow-sm">⌘K</kbd>
            </button>

            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-civic-100 text-civic-500 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white shadow-sm shadow-red-500/30" />
            </button>

            {/* Profile avatar */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-civic-100 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-3 h-3 text-civic-400 hidden sm:block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 glass-elevated py-1.5 animate-scale-in z-50 shadow-xl">
                    <div className="px-4 py-3 border-b border-civic-100">
                      <p className="text-sm font-bold text-civic-800 font-display">{user?.name}</p>
                      <p className="text-xs text-civic-400 mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-colors font-medium"
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

        {/* Footer */}
        <footer className="py-2.5 px-4 lg:px-6 flex items-center justify-center gap-1.5 border-t border-civic-200/20 bg-white/50 backdrop-blur-sm">
          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
          <span className="text-[10px] text-civic-400 font-medium">Built by</span>
          <span className="text-[10px] font-bold font-display bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #0ea5e9, #8b5cf6)' }}>Jayakrushna & Keerthi</span>
          <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
        </footer>
      </div>
    </div>
  );
}


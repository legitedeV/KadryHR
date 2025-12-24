import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const employeeLinks = [
    { to: '/app', label: 'Dashboard', icon: HomeIcon, end: true },
    { to: '/self-service', label: 'Panel pracownika', icon: UserCircleIcon },
    { to: '/time-tracking', label: 'Czas pracy', icon: ClockIcon },
    { to: '/chat', label: 'Wiadomości', icon: ChatBubbleLeftRightIcon },
  ];

  const adminLinks = [
    { to: '/employees', label: 'Pracownicy', icon: UserGroupIcon },
    { to: '/payroll', label: 'Narzędzia', icon: CurrencyDollarIcon },
    { to: '/schedule-builder', label: 'Grafik', icon: CalendarDaysIcon },
    { to: '/admin/requests', label: 'Wnioski', icon: ClipboardDocumentListIcon },
    { to: '/permissions', label: 'Uprawnienia', icon: ShieldCheckIcon },
  ];

  const linkClasses = ({ isActive }) =>
    [
      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative sidebar-link backdrop-blur-sm',
      isActive
        ? 'active font-medium'
        : 'text-text-muted hover:bg-surface-hover'
    ].join(' ');

  const renderLink = (link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={linkClasses}
      onClick={closeMobile}
      title={collapsed ? link.label : ''}
    >
      <link.icon className="w-5 h-5 flex-shrink-0 text-icon-muted" />
      {!collapsed && <span className="text-sm">{link.label}</span>}
      {collapsed && (
        <div className="sidebar-tooltip">
          {link.label}
        </div>
      )}
    </NavLink>
  );

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-4 border-b border-white/60 dark:border-slate-700/70 bg-white/60 dark:bg-slate-900/70 backdrop-blur-xl`}> 
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-lg transition-all duration-300"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 12px 20px -6px rgba(var(--theme-primary-rgb), 0.4)`
              }}
            >
              KH
            </div>
            <span 
              className="text-sm font-semibold bg-clip-text text-transparent transition-all duration-300"
              style={{
                backgroundImage: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`
              }}
            >
              KadryHR
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors border border-transparent hover:border-white/40 dark:hover:border-slate-600"
          title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Employee Section */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2">
              <h3 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider opacity-60">
                Menu główne
              </h3>
            </div>
          )}
          <div className="space-y-1">
            {employeeLinks.map(renderLink)}
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            {!collapsed && (
              <div className="px-3 mb-2">
                <h3 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider opacity-60">
                  Administrator
                </h3>
              </div>
            )}
            {collapsed && (
              <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
            )}
            <div className="space-y-1">
              {adminLinks.map(renderLink)}
            </div>
          </div>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-white/90 dark:bg-slate-950/80 border border-white/60 dark:border-slate-800/70 shadow-lg shadow-theme/30 backdrop-blur-xl"
      >
        {mobileOpen ? (
          <XMarkIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white/85 dark:bg-slate-950/80 border-r border-white/60 dark:border-slate-800/70 z-40 md:hidden transition-transform duration-300 backdrop-blur-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-white/80 dark:bg-slate-950/80 border-r border-white/60 dark:border-slate-800/70 sticky top-0 sidebar-transition backdrop-blur-xl ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  QrCodeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return user.avatarUrl.startsWith('http') ? user.avatarUrl : `${baseUrl}${user.avatarUrl}`;
    }
    return null;
  };

  const employeeLinks = [
    { to: '/app', label: 'Dashboard', icon: HomeIcon, end: true },
    { to: '/self-service', label: 'Panel pracownika', icon: UserCircleIcon },
    { to: '/time-tracking', label: 'Rejestracja czasu', icon: ClockIcon },
    { to: '/chat', label: 'Wiadomości', icon: ChatBubbleLeftRightIcon },
    { to: '/leaves', label: 'Urlopy', icon: CalendarIcon },
    { to: '/notifications', label: 'Powiadomienia', icon: BellIcon }
  ];

  const adminLinks = [
    { to: '/employees', label: 'Pracownicy', icon: UserGroupIcon },
    { to: '/payroll', label: 'Kalkulator', icon: CurrencyDollarIcon },
    { to: '/reports', label: 'Raporty', icon: DocumentChartBarIcon },
    { to: '/schedule-builder', label: 'Grafik miesięczny', icon: CalendarDaysIcon },
    { to: '/invites', label: 'Zaproszenia', icon: EnvelopeIcon },
    { to: '/qr-generator', label: 'Generator QR', icon: QrCodeIcon },
    { to: '/admin/requests', label: 'Wnioski', icon: ClipboardDocumentListIcon }
  ];

  const settingsLinks = [
    { to: '/profile', label: 'Profil', icon: UserCircleIcon },
    { to: '/settings', label: 'Ustawienia', icon: Cog6ToothIcon }
  ];

  const linkClasses = ({ isActive }) =>
    [
      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
      isActive
        ? 'nav-link-active font-medium'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
      <link.icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm">{link.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {link.label}
        </div>
      )}
    </NavLink>
  );

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-4 border-b border-slate-200 dark:border-slate-700`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-lg transition-all duration-300"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
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
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
        </button>
      </div>

      {/* User Info */}
      <div className={`px-4 py-4 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="relative group">
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                  boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
                }}
              >
                {getInitials(user?.name)}
              </div>
            )}
            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              <div className="font-semibold">{user?.name}</div>
              <div className="text-slate-300">{user?.email}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                  boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
                }}
              >
                {getInitials(user?.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Employee Section */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Panel administratora
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

        {/* Settings Section */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Ustawienia
              </h3>
            </div>
          )}
          {collapsed && (
            <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
          )}
          <div className="space-y-1">
            {settingsLinks.map(renderLink)}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group relative ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Wyloguj' : ''}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Wyloguj</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Wyloguj
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg"
      >
        {mobileOpen ? (
          <XMarkIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
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
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 md:hidden transition-transform duration-300 ${
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
        className={`hidden md:flex flex-col h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky top-0 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

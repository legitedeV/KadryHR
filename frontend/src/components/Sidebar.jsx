import React, { useState, useEffect, Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../utils/permissions';
import api from '../api/axios';
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
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { themeMode, updateThemeMode } = useTheme();
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch conversations for chat
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data.conversations || [];
    },
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadNotifications = notificationsData?.filter(n => !n.read).length || 0;
  const unreadMessages = conversationsData?.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0) || 0;

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
    { to: '/time-tracking', label: 'Czas pracy', icon: ClockIcon },
    { to: '/chat', label: 'Wiadomości', icon: ChatBubbleLeftRightIcon },
  ];

  const adminLinks = [
    { 
      to: '/employees', 
      label: 'Pracownicy', 
      icon: UserGroupIcon,
      permission: PERMISSIONS.EMPLOYEES_VIEW
    },
    { 
      to: '/payroll', 
      label: 'Narzędzia', 
      icon: CurrencyDollarIcon,
      permissions: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_CALCULATE]
    },
    { 
      to: '/schedule-builder', 
      label: 'Grafik', 
      icon: CalendarDaysIcon,
      permission: PERMISSIONS.SCHEDULE_VIEW
    },
    { 
      to: '/admin/requests', 
      label: 'Wnioski', 
      icon: ClipboardDocumentListIcon,
      permission: PERMISSIONS.REQUESTS_MANAGE
    },
    { 
      to: '/permissions', 
      label: 'Uprawnienia', 
      icon: ShieldCheckIcon,
      adminOnly: true
    },
    { 
      to: '/webhooks', 
      label: 'Webhooks', 
      icon: LinkIcon,
      adminOnly: true
    },
  ];

  const ThemeToggle = ({ mode, icon: Icon, label, isActive }) => (
    <button
      onClick={() => updateThemeMode(mode)}
      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isActive
            ? 'shadow-sm'
            : 'bg-slate-300 dark:bg-slate-600'
        }`}
        style={isActive ? {
          background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`
        } : {}}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );

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
        {(isAdmin || adminLinks.some(link => {
          if (link.adminOnly) return false;
          if (link.permission) return hasPermission(link.permission);
          if (link.permissions) return hasAnyPermission(link.permissions);
          return false;
        })) && (
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
              {adminLinks.filter(link => {
                // Admin-only links require admin role
                if (link.adminOnly) return isAdmin;
                // Permission-based links
                if (link.permission) return isAdmin || hasPermission(link.permission);
                if (link.permissions) return isAdmin || hasAnyPermission(link.permissions);
                return true;
              }).map(renderLink)}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-white/60 dark:border-slate-700/70 px-3 py-3 space-y-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
        {/* Notifications Button */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
          title={collapsed ? 'Powiadomienia' : ''}
        >
          <BellIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Powiadomienia</span>}
          {unreadNotifications > 0 && (
            <span 
              className={`flex items-center justify-center ${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} w-5 h-5 text-[10px] font-bold text-white rounded-full`}
              style={{ background: 'var(--theme-primary)' }}
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
          {collapsed && (
            <div className="sidebar-tooltip">
              Powiadomienia
            </div>
          )}
        </button>

        {/* Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
          title={collapsed ? 'Wiadomości' : ''}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Wiadomości</span>}
          {unreadMessages > 0 && (
            <span 
              className={`flex items-center justify-center ${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} w-5 h-5 text-[10px] font-bold text-white rounded-full`}
              style={{ background: 'var(--theme-primary)' }}
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          {collapsed && (
            <div className="sidebar-tooltip">
              Wiadomości
            </div>
          )}
        </button>

        {/* User Profile Menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors">
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()}
                alt={user?.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
              />
            ) : (
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
                }}
              >
                {getInitials(user?.name)}
              </div>
            )}
            {!collapsed && <span className="text-sm truncate">{user?.name}</span>}
            {collapsed && (
              <div className="sidebar-tooltip">
                {user?.name}
              </div>
            )}
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute bottom-full left-0 mb-2 w-64 origin-bottom-left bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-2xl shadow-theme/20 dark:shadow-black/40 border border-white/60 dark:border-slate-800/70 focus:outline-none overflow-hidden backdrop-blur-xl">
              <div className="py-1">
                {/* Profile */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        navigate('/profile');
                        closeMobile();
                      }}
                      className={`${
                        active ? 'bg-white/70 dark:bg-slate-800/70' : ''
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 transition-colors`}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      Mój profil
                    </button>
                  )}
                </Menu.Item>

                {/* Settings */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        navigate('/settings');
                        closeMobile();
                      }}
                      className={`${
                        active ? 'bg-white/70 dark:bg-slate-800/70' : ''
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 transition-colors`}
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      Ustawienia
                    </button>
                  )}
                </Menu.Item>

                {/* Theme Separator */}
                <div className="my-1 border-t border-white/60 dark:border-slate-800/70" />
                
                {/* Theme Section Header */}
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Motyw
                  </p>
                </div>
                
                {/* Theme Options */}
                <ThemeToggle
                  mode="light"
                  icon={SunIcon}
                  label="Jasny"
                  isActive={themeMode === 'light'}
                />
                <ThemeToggle
                  mode="dark"
                  icon={MoonIcon}
                  label="Ciemny"
                  isActive={themeMode === 'dark'}
                />
                <ThemeToggle
                  mode="system"
                  icon={ComputerDesktopIcon}
                  label="Systemowy"
                  isActive={themeMode === 'system'}
                />

                {/* Logout Separator */}
                <div className="my-1 border-t border-white/60 dark:border-slate-800/70" />
                
                {/* Logout */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-red-50/80 dark:bg-red-900/30' : ''
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 transition-colors`}
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      Wyloguj
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
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

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsNotificationsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Powiadomienia</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadNotifications} nieprzeczytanych
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsNotificationsOpen(false);
                    closeMobile();
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Zobacz wszystkie
                </button>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {!notificationsData || notificationsData.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Brak powiadomień</p>
                </div>
              ) : (
                notificationsData.slice(0, 20).map((notification) => (
                  <div
                    key={notification._id}
                    className={`rounded-lg border p-3 transition-colors ${
                      notification.read
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString('pl-PL')}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification._id)}
                          className="text-xs font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          Oznacz
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Chat Drawer */}
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsChatOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wiadomości</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadMessages} nieprzeczytanych
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsChatOpen(false);
                    navigate('/chat');
                    closeMobile();
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Otwórz czat
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {!conversationsData || conversationsData.length === 0 ? (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Brak konwersacji</p>
                </div>
              ) : (
                conversationsData.map((conversation) => {
                  const otherParticipant = conversation.participants?.find(p => p._id !== user?.id);
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => {
                        setIsChatOpen(false);
                        navigate('/chat');
                        closeMobile();
                      }}
                      className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                        conversation.unreadCount > 0
                          ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                          style={{ background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))` }}
                        >
                          {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {otherParticipant?.name || 'Użytkownik'}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <span 
                                className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white rounded-full flex-shrink-0"
                                style={{ background: 'var(--theme-primary)' }}
                              >
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                            {conversation.lastMessage?.content || 'Brak wiadomości'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;

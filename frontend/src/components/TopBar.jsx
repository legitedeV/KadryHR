import React, { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const TopBar = ({ title }) => {
  const { user, logout } = useAuth();
  const { themeMode, updateThemeMode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
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

  const ThemeToggle = ({ mode, icon: Icon, label, isActive }) => (
    <button
      onClick={() => updateThemeMode(mode)}
      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      {/* iOS-style toggle */}
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

  return (
    <div className="sticky top-0 z-30 border-b border-white/60 dark:border-slate-800/70 bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 text-slate-700 dark:text-slate-200">
        {/* Left: Title */}
        <div className="flex-1">
          {title && (
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions + User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
            title="Powiadomienia"
          >
            <BellIcon className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span 
                className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white rounded-full"
                style={{ background: 'var(--theme-primary)' }}
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Messages */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
            title="Wiadomości"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span 
                className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white rounded-full"
                style={{ background: 'var(--theme-primary)' }}
              >
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors border border-transparent hover:border-white/50 dark:hover:border-slate-700/60">
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg transition-all duration-300"
                  style={{
                    background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                    boxShadow: `0 4px 6px -1px rgba(var(--theme-primary-rgb), 0.3)`
                  }}
                >
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.name}
                </p>
              </div>
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
              <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-2xl shadow-theme/20 dark:shadow-black/40 border border-white/60 dark:border-slate-800/70 focus:outline-none overflow-hidden backdrop-blur-xl">
                <div className="py-1">
                  {/* Profile */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
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
                        onClick={() => navigate('/settings')}
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
      </div>

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
                  onClick={() => navigate('/notifications')}
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
    </div>
  );
};

export default TopBar;

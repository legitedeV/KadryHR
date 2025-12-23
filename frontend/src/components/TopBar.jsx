import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const TopBar = ({ title }) => {
  const { user, logout } = useAuth();
  const { themeMode, updateThemeMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Title */}
        <div className="flex-1">
          {title && (
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions + User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Powiadomienia"
          >
            <BellIcon className="w-5 h-5" />
          </button>

          {/* Messages */}
          <button
            onClick={() => navigate('/chat')}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Wiadomości"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
              <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 focus:outline-none overflow-hidden">
                <div className="py-1">
                  {/* Profile */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
                        className={`${
                          active ? 'bg-slate-100 dark:bg-slate-700' : ''
                        } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300`}
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
                          active ? 'bg-slate-100 dark:bg-slate-700' : ''
                        } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300`}
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        Ustawienia
                      </button>
                    )}
                  </Menu.Item>

                  {/* Theme Separator */}
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  
                  {/* Theme Section Header */}
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  
                  {/* Logout */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-red-50 dark:bg-red-900/20' : ''
                        } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400`}
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
    </div>
  );
};

export default TopBar;

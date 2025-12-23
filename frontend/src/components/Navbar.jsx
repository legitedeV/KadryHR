import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const scrollContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

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

  // Check scroll position to show/hide gradients
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftGradient(scrollLeft > 10);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [user, isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const linkClasses = ({ isActive }) =>
    [
      'px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap block nav-link',
      isActive
        ? 'nav-link-active'
        : 'text-slate-600 dark:text-slate-300',
    ].join(' ');

  const handleLogout = () => {
    logout();
    setOpen(false);
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur dark:bg-slate-800/80 dark:border-slate-700 sticky top-0 z-50">
      <nav className="app-shell flex items-center justify-between h-14 gap-2">
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

        <div className="hidden md:block flex-1 relative max-w-2xl mx-4">
          {user && (
            <>
              {/* Left gradient indicator */}
              {showLeftGradient && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-800 pointer-events-none z-10" />
              )}
              
              {/* Scrollable navigation */}
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <NavLink to="/app" className={linkClasses} end>
                  Dashboard
                </NavLink>
                <NavLink to="/self-service" className={linkClasses}>
                  Panel pracownika
                </NavLink>
                <NavLink to="/time-tracking" className={linkClasses}>
                  Rejestracja czasu
                </NavLink>
                {isAdmin && (
                  <>
                    <NavLink to="/employees" className={linkClasses}>
                      Pracownicy
                    </NavLink>
                    <NavLink to="/payroll" className={linkClasses}>
                      Kalkulator
                    </NavLink>
                    <NavLink to="/reports" className={linkClasses}>
                      Raporty
                    </NavLink>
                    <NavLink to="/schedule-builder" className={linkClasses}>
                      Grafik miesięczny
                    </NavLink>
                    <NavLink to="/invites" className={linkClasses}>
                      Zaproszenia
                    </NavLink>
                    <NavLink to="/qr-generator" className={linkClasses}>
                      Generator QR
                    </NavLink>
                  </>
                )}
              </div>

              {/* Right gradient indicator */}
              {showRightGradient && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-800 pointer-events-none z-10" />
              )}
            </>
          )}
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all duration-200 user-menu-btn"
                style={{
                  borderColor: `rgba(var(--theme-primary-rgb), 0.3)`,
                  color: `var(--theme-primary)`
                }}
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-scale-in">
                  {/* Profile Section */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {getAvatarUrl() ? (
                        <img
                          src={getAvatarUrl()}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg transition-all duration-300"
                          style={{
                            background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                            boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
                          }}
                        >
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    {user.supervisor && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Przełożony:</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{user.supervisor.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Profile Link */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profil</span>
                  </button>

                  {/* Settings Link */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Ustawienia</span>
                  </button>

                  {/* Divider */}
                  <div className="my-2 border-t border-slate-100 dark:border-slate-700"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Wyloguj</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
              }}
            >
              Zaloguj
            </NavLink>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                {user.name}
              </div>
              <div 
                className="text-[10px] uppercase tracking-wide transition-colors duration-300"
                style={{ color: `var(--theme-primary)` }}
              >
                {user.role === 'admin' || user.role === 'super_admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 h-8 w-8 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <span className="sr-only">Menu</span>
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {user && open && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="app-shell py-2 flex flex-col space-y-1">
            <NavLink
              to="/app"
              end
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/self-service"
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              Panel pracownika
            </NavLink>
            <NavLink
              to="/time-tracking"
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              Rejestracja czasu
            </NavLink>
            {isAdmin && (
              <>
                <NavLink
                  to="/employees"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Pracownicy
                </NavLink>
                <NavLink
                  to="/payroll"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Kalkulator
                </NavLink>
                <NavLink
                  to="/reports"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Raporty
                </NavLink>
                <NavLink
                  to="/schedule-builder"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Grafik miesięczny
                </NavLink>
                <NavLink
                  to="/invites"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Zaproszenia
                </NavLink>
                <NavLink
                  to="/qr-generator"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Generator QR
                </NavLink>
              </>
            )}

            {/* Mobile Profile & Settings */}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
              <NavLink
                to="/profile"
                onClick={() => setOpen(false)}
                className={linkClasses}
              >
                Profil
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setOpen(false)}
                className={linkClasses}
              >
                Ustawienia
              </NavLink>
            </div>

            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-red-200 dark:border-red-700 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

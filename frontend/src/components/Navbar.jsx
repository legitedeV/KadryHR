import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const scrollContainerRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

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

  const linkClasses = ({ isActive }) =>
    [
      'px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap block',
      isActive
        ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 shadow-sm'
        : 'text-slate-600 hover:bg-pink-50 hover:text-pink-700',
    ].join(' ');

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav className="app-shell flex items-center justify-between h-14 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-pink-500/30">
            KH
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">KadryHR</span>
        </div>

        <div className="hidden md:block flex-1 relative max-w-2xl mx-4">
          {user && (
            <>
              {/* Left gradient indicator */}
              {showLeftGradient && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent pointer-events-none z-10" />
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
                  </>
                )}
                <NavLink to="/settings" className={linkClasses}>
                  Ustawienia
                </NavLink>
              </div>

              {/* Right gradient indicator */}
              {showRightGradient && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10" />
              )}
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user && (
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                {user.name}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-pink-600 font-semibold">
                {user.role === 'admin' || user.role === 'super_admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
              </div>
            </div>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border-2 border-pink-200 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50 transition-all duration-200"
            >
              Wyloguj
            </button>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all duration-200"
            >
              Zaloguj
            </NavLink>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {user && (
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-900 truncate max-w-[110px]">
                {user.name}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-pink-600">
                {user.role === 'admin' || user.role === 'super_admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 h-8 w-8 text-slate-700 hover:bg-slate-50"
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

      {user && open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
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
              </>
            )}
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              Ustawienia
            </NavLink>

            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-pink-200 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50"
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

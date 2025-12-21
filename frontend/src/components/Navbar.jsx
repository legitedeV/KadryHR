import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const linkClasses = ({ isActive }) =>
    [
      'px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap',
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-100',
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
          <div className="h-8 w-8 rounded-2xl bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            KH
          </div>
          <span className="text-sm font-semibold text-slate-900">KadryHR</span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user && (
            <>
              <NavLink to="/app" className={linkClasses} end>
                Dashboard
              </NavLink>
              <NavLink to="/self-service" className={linkClasses}>
                Panel pracownika
              </NavLink>
              <NavLink to="/employees" className={linkClasses}>
                Pracownicy
              </NavLink>
              <NavLink to="/payroll" className={linkClasses}>
                Kalkulator
              </NavLink>
              <NavLink to="/reports" className={linkClasses}>
                Raporty
              </NavLink>
              {isAdmin && (
                <NavLink to="/schedule-builder" className={linkClasses}>
                  Grafik miesięczny
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/invites" className={linkClasses}>
                  Zaproszenia
                </NavLink>
              )}

              {isAdmin && <div className="h-6 w-px bg-slate-200" aria-hidden />}

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Admin
                  </span>
                  <NavLink to="/app" className={linkClasses} end>
                    Dashboard
                  </NavLink>
                  <NavLink to="/employees" className={linkClasses}>
                    Pracownicy
                  </NavLink>
                  <NavLink to="/schedule-builder" className={linkClasses}>
                    Grafik miesięczny
                  </NavLink>
                  <NavLink to="/payroll" className={linkClasses}>
                    Kalkulator
                  </NavLink>
                  <NavLink to="/reports" className={linkClasses}>
                    Raporty
                  </NavLink>
                  <NavLink to="/invites" className={linkClasses}>
                    Zaproszenia
                  </NavLink>
                </div>
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
              <div className="text-[11px] uppercase tracking-wide text-indigo-600">
                {user.role === 'admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
              </div>
            </div>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Wyloguj
            </button>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
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
              <div className="text-[10px] uppercase tracking-wide text-indigo-600">
                {user.role === 'admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
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
          <div className="app-shell py-2 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Pracownik
            </div>
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
              Panel pracownika
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/schedule-builder"
                onClick={() => setOpen(false)}
                className={linkClasses}
              >
                Grafik miesięczny
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/invites"
                onClick={() => setOpen(false)}
                className={linkClasses}
              >
                Zaproszenia
              </NavLink>
            )}

            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

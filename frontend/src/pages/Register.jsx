import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const inviteEmail = searchParams.get('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const inviteMode = Boolean(inviteToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteMode) {
      setError('Rejestracja możliwa tylko przez link z zaproszenia.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          inviteToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Błąd rejestracji. Spróbuj ponownie.');
      }

      login(data);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Błąd rejestracji. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">
          Rejestracja
        </h1>

        <p className="text-xs text-slate-500 mb-4">
          {inviteMode ? (
            <>
              Uzupełnij dane, aby dokończyć rejestrację z zaproszenia.
              <br />
              Link został wygenerowany przez administratora systemu.
            </>
          ) : (
            <>
              Rejestracja możliwa tylko przez zaproszenie od administratora.
              <br />
              Poproś administratora o wygenerowanie linku rejestracyjnego.
            </>
          )}
        </p>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Imię i nazwisko
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus-theme bg-slate-50 transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!inviteMode || submitting}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus-theme bg-slate-50 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!inviteEmail || !inviteMode || submitting}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Hasło
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus-theme bg-slate-50 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!inviteMode || submitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!inviteMode || submitting}
            className="mt-2 w-full inline-flex justify-center rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {submitting ? 'Rejestruję...' : 'Zarejestruj'}
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          Masz już konto?{' '}
          <Link
            to="/login"
            className="text-theme-primary font-medium hover:text-theme-primary hover:underline transition-colors duration-200"
          >
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

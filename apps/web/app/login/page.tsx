"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
    alert("Funkcja logowania zostanie zintegrowana z API V2");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="app-card p-8 max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Logowanie
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Zaloguj się do systemu KadryHR V2
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-primary"
              placeholder="twoj@email.pl"
              required
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded"
                style={{ 
                  accentColor: 'var(--theme-primary)',
                  marginRight: '0.5rem'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Zapamiętaj mnie
              </span>
            </label>
            <a 
              href="#" 
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--theme-primary)' }}
            >
              Zapomniałeś hasła?
            </a>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
          >
            Zaloguj się
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Nie masz konta?{" "}
            <a 
              href="#" 
              className="font-medium hover:underline"
              style={{ color: 'var(--theme-primary)' }}
            >
              Zarejestruj się
            </a>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <a 
            href="/" 
            className="text-sm hover:underline block text-center"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ← Powrót do strony głównej
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(false);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Uzupełnij wszystkie pola.");
      return;
    }
    const emailOk = /\S+@\S+\.\S+/.test(email);
    if (!emailOk) {
      setError("Podaj poprawny adres e-mail.");
      return;
    }
    setError(null);
    // TODO: Connect to a dedicated backend-v2 endpoint or CRM webhook.
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2 text-sm">
        <label className="block text-slate-700 dark:text-slate-200">
          Imię i nazwisko
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
          placeholder="np. Anna Kowalska"
          required
        />
      </div>
      <div className="space-y-2 text-sm">
        <label className="block text-slate-700 dark:text-slate-200">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
          placeholder="twoj@sklep.pl"
          required
        />
      </div>
      <div className="space-y-2 text-sm">
        <label className="block text-slate-700 dark:text-slate-200">
          Wiadomość
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-700/40"
          placeholder="Opisz potrzeby swojego zespołu..."
          required
        />
      </div>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100">
          {error}
        </p>
      )}
      {sent && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100">
          Dziękujemy! Odezwiemy się w ciągu 1 dnia roboczego.
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-full bg-brand-500 py-2 text-sm font-medium text-white shadow-soft hover:bg-brand-600"
      >
        Wyślij wiadomość
      </button>
    </form>
  );
}

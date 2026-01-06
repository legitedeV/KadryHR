export default function AuditPage() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white/90 p-6 shadow-sm dark:border-surface-800 dark:bg-surface-950/60">
      <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Audit log</h1>
      <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
        Backend rejestruje akcje w tabeli <code>AuditLog</code>, ale publiczny endpoint listujący wpisy nie jest jeszcze dostępny.
      </p>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        Po udostępnieniu API widok pokaże filtrowalną listę logów (daty, akcje, aktor). Zgłoszone w backlogu: „Frontend – parity follow-ups”.
      </div>
    </div>
  );
}

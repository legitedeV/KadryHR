import { useState } from 'react';

export function AssistantPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <button
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-700"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Automatyzacje (opcjonalne)</span>
        <span className="text-xs text-blue-600">{open ? 'Ukryj' : 'Pokaż'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p className="text-slate-500">Opcjonalne skróty, manualny grafik pozostaje źródłem prawdy.</p>
          <div className="flex gap-2">
            <button className="rounded-lg bg-blue-600 px-3 py-1 text-white shadow-sm hover:bg-blue-700">Auto-uzupełnij weekendy</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1 hover:border-blue-300">Wstaw ostatni szablon</button>
          </div>
        </div>
      )}
    </div>
  );
}

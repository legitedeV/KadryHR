export function FloatingStats() {
  return (
    <>
      <div className="absolute -left-6 top-10 hidden rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-xs shadow-[0_20px_50px_rgba(15,23,42,0.2)] lg:block">
        <p className="text-slate-400">Wnioski</p>
        <p className="mt-1 text-base font-semibold text-slate-800">12 czeka</p>
        <div className="mt-2 flex -space-x-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <span key={idx} className="h-7 w-7 rounded-full border-2 border-white bg-gradient-to-br from-slate-200 to-slate-100" />
          ))}
        </div>
      </div>

      <div className="absolute -right-8 top-28 hidden rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-xs shadow-[0_20px_50px_rgba(15,23,42,0.2)] lg:block">
        <p className="text-slate-400">Czas pracy</p>
        <p className="mt-1 text-base font-semibold text-slate-800">97% zgodność</p>
        <div className="mt-2 h-2 w-28 rounded-full bg-slate-100">
          <div className="h-2 w-24 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
        </div>
      </div>

      <div className="absolute -bottom-8 left-16 hidden rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-xs shadow-[0_20px_50px_rgba(15,23,42,0.2)] lg:block">
        <p className="text-slate-400">Alerty zmian</p>
        <p className="mt-1 text-base font-semibold text-slate-800">5 powiadomień</p>
        <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
          Wysłano 2 min temu
        </div>
      </div>
    </>
  );
}

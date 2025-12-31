import { MarketingHeader } from "@/components/MarketingHeader";
import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/60 via-white to-slate-100/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 space-y-10">
        <div className="space-y-3">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Kontakt
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
            Napisz do nas – odpowiemy w 24h
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Opisz swoje potrzeby: ile lokalizacji, ilu pracowników i jak
            wyglądają Wasze grafiki. Przygotujemy krótkie demo pod Twój przypadek.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card p-6 space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Dane kontaktowe
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              E-mail: kontakt@kadryhr.pl
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Telefon: +48 500 600 700
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pon–Pt, 9:00–17:00
            </p>
          </div>
          <div className="card p-6">
            <ContactForm />
          </div>
        </div>
      </main>
    </div>
  );
}

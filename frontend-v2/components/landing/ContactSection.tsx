import { Mail, MapPin, Phone } from "lucide-react";

export function ContactSection() {
  return (
    <section id="kontakt" className="bg-slate-50/70 landing-section">
      <div className="landing-container grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-6">
          <p className="text-[clamp(0.75rem,0.4vw+0.6rem,0.85rem)] font-semibold uppercase tracking-wide text-orange-600">
            Kontakt
          </p>
          <h2 className="landing-title text-slate-900">Porozmawiajmy o potrzebach Twojej organizacji</h2>
          <p className="landing-body text-slate-600">
            Umów bezpłatną konsultację i sprawdź, jak możemy odciążyć Twój dział HR oraz zwiększyć
            przewidywalność kosztów kadrowo-płacowych.
          </p>
          <div className="grid gap-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Kontakt bezpośredni</p>
              <a className="flex items-center gap-2 transition hover:text-slate-900" href="mailto:kontakt@kadryhr.pl">
                <Mail className="h-4 w-4" aria-hidden="true" />
                kontakt@kadryhr.pl
              </a>
              <a className="flex items-center gap-2 transition hover:text-slate-900" href="tel:+48223071120">
                <Phone className="h-4 w-4" aria-hidden="true" />
                +48 22 307 11 20
              </a>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Biuro</p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>ul. Nowoczesna 12, 00-123 Warszawa</span>
              </p>
            </div>
          </div>
        </div>
        <form
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-label="Formularz kontaktowy"
        >
          <div className="grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              Imię i nazwisko
              <input
                type="text"
                name="name"
                placeholder="Jan Kowalski"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email firmowy
              <input
                type="email"
                name="email"
                placeholder="jan@firma.pl"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Krótka wiadomość
              <textarea
                name="message"
                rows={4}
                placeholder="Opisz swoje potrzeby kadrowe"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <button
              type="submit"
              className="min-h-[44px] rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              Wyślij zapytanie
            </button>
            <p className="text-xs text-slate-500">Odpowiadamy w ciągu 24 godzin w dni robocze.</p>
          </div>
        </form>
      </div>
    </section>
  );
}

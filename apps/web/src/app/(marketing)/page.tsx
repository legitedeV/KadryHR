import Link from "next/link";
import {
  Badge,
  FeatureGrid,
  HeroLayout,
  KadryButton,
  Section,
  FAQItem,
  KadryCard,
} from "@kadryhr/ui";
import {
  CalendarDays,
  Clock3,
  ClipboardCheck,
  Smartphone,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    title: "Grafik pracy w chmurze",
    description:
      "Planowanie zmian i dostęp do grafiku w czasie rzeczywistym, bez nieczytelnych arkuszy.",
    icon: <CalendarDays className="h-6 w-6" />,
    link: (
      <Link href="/funkcje" className="text-emerald-600 hover:text-emerald-700">
        Poznaj funkcje →
      </Link>
    ),
  },
  {
    title: "Rejestracja czasu pracy (RCP online)",
    description:
      "Start/stop zmian, przerwy i nadgodziny z każdego urządzenia oraz pełna historia zdarzeń.",
    icon: <Clock3 className="h-6 w-6" />,
    link: (
      <Link href="/funkcje" className="text-emerald-600 hover:text-emerald-700">
        Poznaj funkcje →
      </Link>
    ),
  },
  {
    title: "Ewidencja czasu pracy i lista płac",
    description:
      "Automatyczne podsumowania dla działu kadr oraz szybkie rozliczenia okresowe.",
    icon: <ClipboardCheck className="h-6 w-6" />,
    link: (
      <Link href="/funkcje" className="text-emerald-600 hover:text-emerald-700">
        Poznaj funkcje →
      </Link>
    ),
  },
  {
    title: "Aplikacja mobilna dla pracowników",
    description:
      "Wgląd w grafik, zgłoszenia dostępności i wnioski urlopowe w jednym miejscu.",
    icon: <Smartphone className="h-6 w-6" />,
    link: (
      <Link href="/funkcje" className="text-emerald-600 hover:text-emerald-700">
        Poznaj funkcje →
      </Link>
    ),
  },
];

const faqItems = [
  {
    question: "Jak szybko wdrożymy KadryHR w firmie?",
    answer:
      "Pierwszy grafik możesz ułożyć tego samego dnia. Wspieramy import pracowników, lokalizacji i godzin.",
  },
  {
    question: "Czy mogę dopasować RCP do różnych stanowisk?",
    answer:
      "Tak, ustawiasz reguły dla zespołów, a system sam pilnuje wyjątków i tolerancji spóźnień.",
  },
  {
    question: "Czy KadryHR wspiera ewidencję czasu pracy?",
    answer:
      "Ewidencja godzin i nadgodzin jest dostępna w każdym planie oraz eksportowana do plików dla kadr.",
  },
  {
    question: "Czy pracownicy dostają aplikację mobilną?",
    answer:
      "Tak, aplikacja mobilna pozwala podglądać grafik, rejestrować wejścia i składać wnioski.",
  },
  {
    question: "Czy mogę integrować KadryHR z listą płac?",
    answer:
      "Udostępniamy raporty i eksporty, które ułatwiają przekazanie danych do systemów kadrowo-płacowych.",
  },
];

export default function HomePage() {
  return (
    <div>
      <HeroLayout
        title="KadryHR porządkuje czas pracy, zanim stanie się problemem"
        description="Twórz grafiki, rejestruj czas pracy i rozliczaj zespoły w jednym systemie. KadryHR łączy harmonogramy, RCP online, ewidencję godzin i aplikację mobilną dla pracowników."
        actions={
          <>
            <KadryButton size="lg" href="/auth/register">
              Załóż konto
            </KadryButton>
            <KadryButton variant="secondary" size="lg" href="/auth/login">
              Zaloguj się
            </KadryButton>
          </>
        }
      >
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 p-6 shadow-soft">
          <div className="absolute right-6 top-6 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700">
            Widok aplikacji
          </div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Grafik tygodnia</p>
                <p className="text-lg font-semibold text-emerald-900">Sala sprzedaży</p>
              </div>
              <Badge>Aktualny</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {["Pon", "Wt", "Śr", "Czw"].map((day, index) => (
                <div
                  key={day}
                  className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-emerald-800"
                >
                  <p className="font-semibold text-emerald-900">{day}</p>
                  <p>Zmiana {index + 1}: 8:00–16:00</p>
                  <p className="text-xs text-emerald-500">4 osoby na zmianie</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-900 p-4 text-sm text-emerald-50">
              <p className="text-xs uppercase text-emerald-200">RCP Online</p>
              <p className="mt-1 text-lg font-semibold">Dzisiaj: 46 aktywnych pracowników</p>
              <p className="text-xs text-emerald-200">3 spóźnienia, 1 nadgodzina</p>
            </div>
          </div>
        </div>
      </HeroLayout>

      <Section
        id="funkcje"
        eyebrow="System KadryHR"
        title="KadryHR rozwiązuje problemy z czasem pracy"
        description="Kompletny pakiet funkcji, które porządkują harmonogramy, usprawniają komunikację i pozwalają kontrolować koszty."
      >
        <FeatureGrid items={features} />
      </Section>

      <Section
        eyebrow="Jak to działa"
        title="Cztery kroki do uporządkowanego planu pracy"
        description="Od konfiguracji po rozliczenie - wszystko odbywa się w jednym panelu, bez papierów i rozproszonych narzędzi."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "Konfigurujesz struktury",
              text: "Dodajesz lokalizacje, role i reguły czasu pracy.",
            },
            {
              step: "2",
              title: "Planujesz grafiki",
              text: "Układasz harmonogramy i publikujesz je dla zespołu.",
            },
            {
              step: "3",
              title: "Rejestrujesz czas",
              text: "Pracownicy logują wejścia w aplikacji mobilnej.",
            },
            {
              step: "4",
              title: "Rozliczasz miesiąc",
              text: "Eksportujesz ewidencję i generujesz raporty dla kadr.",
            },
          ].map((item) => (
            <KadryCard key={item.step} className="flex h-full flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                {item.step}
              </div>
              <div>
                <h3 className="text-base font-semibold text-emerald-950">{item.title}</h3>
                <p className="mt-2 text-sm text-emerald-800/80">{item.text}</p>
              </div>
            </KadryCard>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Zaufanie zespołów"
        title="Z KadryHR łatwiej być na bieżąco"
        description="Firmy usługowe, sieci handlowe i logistyka wybierają KadryHR, aby uporządkować czas pracy na wielu lokalizacjach."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Nova Retail",
            "Baltic Bistro",
            "Cargo Pulse",
            "Hotel Vertex",
            "MediCare Plus",
            "GreenWay Logistics",
          ].map((logo) => (
            <div
              key={logo}
              className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-5 py-4"
            >
              <span className="text-sm font-semibold text-emerald-950">{logo}</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Zacznij teraz"
        title="Zobacz, jak szybko KadryHR uporządkuje Twoją organizację"
        description="Wybierz demo online lub rozpocznij bezpłatny okres próbny. Zespół KadryHR przeprowadzi Cię przez konfigurację."
      >
        <div className="flex flex-wrap gap-4 rounded-3xl border border-emerald-200 bg-white px-6 py-8">
          <KadryButton size="lg" href="/cennik">
            Wypróbuj za darmo
          </KadryButton>
          <KadryButton variant="secondary" size="lg" href="/kontakt">
            Umów prezentację
          </KadryButton>
        </div>
      </Section>

      <Section
        id="faq"
        eyebrow="FAQ"
        title="Najczęstsze pytania o KadryHR"
        description="Odpowiedzi na pytania, które pojawiają się podczas wdrażania grafiku i RCP online."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </Section>
    </div>
  );
}

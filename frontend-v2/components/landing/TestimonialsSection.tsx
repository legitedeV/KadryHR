const testimonials = [
  {
    quote:
      "KadryHR uporządkowało nasze procesy kadrowe i przejęło pełną odpowiedzialność za terminowość list płac.",
    name: "Anna Michalska",
    role: "Dyrektor HR, sektor finansowy",
  },
  {
    quote:
      "Zespół doradczy wspiera nas przy zmianach organizacyjnych i zapewnia stały monitoring zgodności z przepisami.",
    name: "Krzysztof Nowak",
    role: "COO, firma technologiczna",
  },
  {
    quote:
      "Doceniamy partnerskie podejście i szybkie reagowanie na pytania naszych managerów.",
    name: "Monika Zielińska",
    role: "HR Manager, retail",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Zaufanie klientów</p>
          <h2 className="text-3xl font-semibold text-slate-900">Referencje, które potwierdzają jakość</h2>
          <p className="text-base text-slate-600">
            Wspieramy firmy z wielu branż, zapewniając im spokój, przewidywalność i stałe wsparcie ekspertów.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-slate-700">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 text-sm font-semibold text-slate-900">{testimonial.name}</figcaption>
              <p className="text-xs text-slate-500">{testimonial.role}</p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

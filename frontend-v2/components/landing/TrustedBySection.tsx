import Image from "next/image";
import { TRUSTED_CLIENTS } from "@/lib/trusted-clients";

export function TrustedBySection() {
  return (
    <section className="relative bg-[#F7F9FB] py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F7F9FB] to-[#F7F9FB]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
            Klienci, którzy nam zaufali
          </p>
          <h2 className="text-3xl font-semibold text-surface-900 sm:text-4xl">
            Firmy, które rozwijają kadry razem z KadryHR.
          </h2>
          <p className="text-sm text-surface-600 sm:text-base">
            Od lokalnych biznesów po rozwijające się sieci sklepów – pomagamy
            poukładać grafik, RCP i kadry w jednym miejscu.
          </p>
        </div>
        <div className="mt-10 grid justify-items-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {TRUSTED_CLIENTS.map((client) => (
            <a
              key={client.name}
              href={client.website}
              target="_blank"
              rel="noreferrer"
              aria-label={`Odwiedź stronę ${client.name}`}
              className="group flex w-full max-w-xs flex-col items-center justify-center rounded-[2rem] border border-surface-300 bg-surface-100 px-5 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1110]"
            >
              <div className="flex h-10 items-center justify-center">
                {client.logoSrc ? (
                  <Image
                    src={client.logoSrc}
                    alt={`Logo ${client.name}`}
                    width={160}
                    height={40}
                    className="h-8 w-auto opacity-90 transition group-hover:opacity-100"
                  />
                ) : (
                  <span className="text-sm font-semibold tracking-wide text-surface-800">
                    {client.logoTextFallback ?? client.name}
                  </span>
                )}
              </div>
              {client.description ? (
                <p className="mt-3 text-xs text-surface-600">
                  {client.description}
                </p>
              ) : null}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { KadryCard, Section } from "@kadryhr/ui";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-emerald-50">
      <Section className="py-16">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">KadryHR</p>
            <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Reset hasła</h1>
            <p className="mt-2 text-emerald-700">
              Na ten moment reset hasła odbywa się przez kontakt z supportem.
            </p>
          </div>
          <KadryCard className="p-6">
            <p className="text-sm text-emerald-800">
              Napisz do nas:{" "}
              <a className="font-semibold text-emerald-600" href="mailto:kontakt@kadryhr.pl">
                kontakt@kadryhr.pl
              </a>
            </p>
            <Link href="/panel/login" className="mt-4 inline-block text-sm font-medium text-emerald-600">
              Wróć do logowania
            </Link>
          </KadryCard>
        </div>
      </Section>
    </div>
  );
}

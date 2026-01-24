import type { ReactNode } from "react";

export function FAQItem({ question, answer }: { question: string; answer: ReactNode }) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6">
      <h3 className="text-base font-semibold text-emerald-950">{question}</h3>
      <p className="mt-3 text-sm text-emerald-800/80">{answer}</p>
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "../utils";
import { KadryButton } from "./KadryButton";

export type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
};

export function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-3xl border p-6",
        plan.highlighted
          ? "border-emerald-500 bg-emerald-50/60 shadow-lg shadow-emerald-900/10"
          : "border-emerald-100 bg-white"
      )}
    >
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-emerald-950">{plan.name}</h3>
        <p className="text-sm text-emerald-800/80">{plan.description}</p>
        <p className="text-3xl font-semibold text-emerald-950">{plan.price}</p>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-emerald-800/80">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <KadryButton className="w-full" href="/kontakt">
          {plan.ctaLabel}
        </KadryButton>
      </div>
    </div>
  );
}

export function PricingTable({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard key={plan.name} plan={plan} />
      ))}
    </div>
  );
}

export function PricingField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-800">
      <span className="font-medium text-emerald-950">{label}</span>
      <span>{value}</span>
    </div>
  );
}

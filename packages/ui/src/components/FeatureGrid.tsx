import type { ReactNode } from "react";
import { KadryCard } from "./KadryCard";

export type FeatureItem = {
  title: string;
  description: string;
  icon: ReactNode;
  link?: ReactNode;
};

export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <KadryCard key={item.title} className="flex h-full flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            {item.icon}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-emerald-950">{item.title}</h3>
            <p className="text-sm text-emerald-800/80">{item.description}</p>
          </div>
          {item.link ? <div className="mt-auto text-sm">{item.link}</div> : null}
        </KadryCard>
      ))}
    </div>
  );
}

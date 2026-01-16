import { notFound } from "next/navigation";
import { BrandLogoMotion } from "@/components/brand/BrandLogoMotion";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";

const sizes = [24, 32, 48, 64, 96, 160];

export default function BrandDevPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-12">
        <div>
          <h1 className="text-2xl font-semibold">KadryHR Brand Logo Preview</h1>
          <p className="text-sm text-surface-400">
            Motion and static variants across common sizes in dark and light contexts.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Dark background</h2>
          <div className="grid gap-6 rounded-3xl border border-surface-800/70 bg-surface-900/60 p-6">
            {sizes.map((size) => (
              <div key={`dark-${size}`} className="flex flex-wrap items-center gap-6">
                <div className="w-16 text-sm text-surface-400">{size}px</div>
                <BrandLogoMotion size={size} variant="full" withPL />
                <BrandLogoMotion size={size} variant="icon" ariaLabel="KadryHR icon" />
                <BrandLogoStatic size={size} variant="full" withPL className="opacity-80" />
                <BrandLogoStatic size={size} variant="icon" ariaLabel="KadryHR icon" className="opacity-80" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-surface-900">Light background</h2>
          <div className="grid gap-6 rounded-3xl border border-surface-200 bg-white p-6 text-surface-900">
            {sizes.map((size) => (
              <div key={`light-${size}`} className="flex flex-wrap items-center gap-6">
                <div className="w-16 text-sm text-surface-500">{size}px</div>
                <BrandLogoMotion size={size} variant="full" withPL className="brand-logo--light" />
                <BrandLogoMotion size={size} variant="icon" ariaLabel="KadryHR icon" />
                <BrandLogoStatic size={size} variant="full" withPL className="brand-logo--light opacity-80" />
                <BrandLogoStatic size={size} variant="icon" ariaLabel="KadryHR icon" className="opacity-80" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

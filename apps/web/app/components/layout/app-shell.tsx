"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { MembershipRole, OrganizationSummary } from "../../lib/auth-types";
import { useAuth, useToast } from "../../providers";

export type NavItem = {
  label: string;
  href: string;
  roles?: MembershipRole[];
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Pulpit", href: "/" },
  { label: "Grafiki", href: "/schedule-builder", roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Czas pracy", href: "/time-tracking", roles: ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"], badge: "wkrótce" },
  { label: "Powiadomienia", href: "/notifications", roles: ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"], badge: "wkrótce" },
  { label: "Zespoły", href: "/employees", roles: ["OWNER", "ADMIN", "MANAGER"], badge: "wkrótce" },
  { label: "Płace", href: "/payroll", roles: ["OWNER", "ADMIN"], badge: "wkrótce" },
  { label: "Ustawienia", href: "/settings", roles: ["OWNER", "ADMIN"], badge: "wkrótce" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout, selectOrganization, hasRole, isLoading } = useAuth();
  const { pushToast } = useToast();
  const [isSwitchingOrg, startSwitch] = useTransition();

  const navigation = useMemo(() => NAV_ITEMS.filter((item) => hasRole(item.roles)), [hasRole]);

  const handleOrgChange = (orgId: string) => {
    if (!orgId) return;
    startSwitch(async () => {
      try {
        await selectOrganization(orgId);
        pushToast("Przełączono organizację", "success");
      } catch (error) {
        pushToast("Nie udało się przełączyć organizacji", "error");
      }
    });
  };

  const activeOrgId = session?.currentOrganization?.id ?? "";

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, var(--page-gradient-start), var(--page-gradient-end))" }}>
      <aside className="w-64 border-r" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            KadryHR V2
          </div>
          <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {session?.currentOrganization?.name || "Bez organizacji"}
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "shadow-sm" : ""
                }`}
                style={{
                  color: isActive ? "var(--theme-primary)" : "var(--text-secondary)",
                  background: isActive ? "rgba(var(--theme-primary-rgb), 0.08)" : "transparent",
                  border: isActive ? `1px solid rgba(var(--theme-primary-rgb), 0.2)` : "1px solid transparent",
                }}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-tertiary)", color: "var(--text-tertiary)" }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2">Pomoc</div>
          <div className="space-y-1 text-sm">
            <a href="https://docs.kadry.hr" className="block hover:underline">
              Dokumentacja
            </a>
            <button
              className="text-left block w-full hover:underline"
              onClick={() => router.push("/health")}
            >
              Status systemu
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center gap-4 px-6 py-4 border-b" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
          <div className="flex-1">
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Witaj ponownie,
            </div>
            <div className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {session?.user.fullName || session?.user.email || "Użytkownik"}
            </div>
          </div>
          <OrgSelector
            value={activeOrgId}
            options={session?.organizations ?? []}
            onChange={handleOrgChange}
            loading={isSwitchingOrg || isLoading}
          />
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border-primary)" }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {session?.currentOrganization?.role || "brak roli"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {session?.user.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-sm font-medium px-3 py-1 rounded-md border"
              style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
            >
              Wyloguj
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">
          <div className="rounded-2xl border shadow-sm" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
            <div className="p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function OrgSelector({
  value,
  options,
  onChange,
  loading,
}: {
  value: string;
  options: OrganizationSummary[];
  onChange: (value: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        Organizacja
      </label>
      <select
        className="mt-1 rounded-lg border px-3 py-2 text-sm min-w-[200px]"
        style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
        value={value}
        disabled={!options.length || loading}
        onChange={(e) => onChange(e.target.value)}
      >
        {!options.length && <option>Brak organizacji</option>}
        {options.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.role})
          </option>
        ))}
      </select>
      {loading && <span className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Aktualizuję kontekst...</span>}
    </div>
  );
}

export function Rbac({ roles, children }: { roles?: MembershipRole | MembershipRole[]; children: React.ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(roles)) return null;
  return <>{children}</>;
}

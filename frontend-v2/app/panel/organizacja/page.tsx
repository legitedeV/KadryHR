"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import {
  apiGetMe,
  apiGetOrganisation,
  apiUpdateOrganisation,
  apiGetOrganisationMembers,
  apiUpdateMemberRole,
  OrganisationMember,
  User,
  Weekday,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { Avatar } from "@/components/Avatar";
import { Modal } from "@/components/Modal";

const CATEGORIES = [
  "Gastronomia",
  "Handel detaliczny",
  "Usługi",
  "Produkcja",
  "Logistyka",
  "IT / Software",
  "Edukacja",
  "Zdrowie",
  "Inne",
];

const WEEKDAY_OPTIONS: { key: Weekday; label: string }[] = [
  { key: "MONDAY", label: "Poniedziałek" },
  { key: "TUESDAY", label: "Wtorek" },
  { key: "WEDNESDAY", label: "Środa" },
  { key: "THURSDAY", label: "Czwartek" },
  { key: "FRIDAY", label: "Piątek" },
  { key: "SATURDAY", label: "Sobota" },
  { key: "SUNDAY", label: "Niedziela" },
];

export default function OrganisationSettingsPage() {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Form state - schedule settings
  const [deliveryDays, setDeliveryDays] = useState<Weekday[]>([]);
  const [deliveryLabelColor, setDeliveryLabelColor] = useState("#22c55e");
  const [promotionCycleStartDate, setPromotionCycleStartDate] = useState("");
  const [promotionCycleFrequency, setPromotionCycleFrequency] = useState(14);

  // Role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganisationMember | null>(null);
  const [newRole, setNewRole] = useState<"MANAGER" | "ADMIN" | "EMPLOYEE">("EMPLOYEE");

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([apiGetMe(), apiGetOrganisation(), apiGetOrganisationMembers()])
      .then(([userData, orgData, membersData]) => {
        if (cancelled) return;

        // Check permissions
        if (!["OWNER", "MANAGER"].includes(userData.role)) {
          router.replace("/panel/dashboard");
          return;
        }

        setUser(userData);
        setMembers(membersData);

        // Initialize form - basic info
        setName(orgData.name);
        setDescription(orgData.description ?? "");
        setCategory(orgData.category ?? "");
        setLogoUrl(orgData.logoUrl ?? "");

        // Initialize form - schedule settings
        setDeliveryDays(orgData.deliveryDays ?? []);
        setDeliveryLabelColor(orgData.deliveryLabelColor ?? "#22c55e");
        setPromotionCycleStartDate(orgData.promotionCycleStartDate?.slice(0, 10) ?? "");
        setPromotionCycleFrequency(orgData.promotionCycleFrequency ?? 14);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Nie udało się pobrać danych organizacji");
          clearAuthTokens();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, router]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      pushToast({
        title: "Błąd",
        description: "Nazwa organizacji jest wymagana",
        variant: "error",
      });
      return;
    }

    setSaving(true);
    try {
      await apiUpdateOrganisation({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        logoUrl: logoUrl.trim() || undefined,
        deliveryDays: deliveryDays.length > 0 ? deliveryDays : undefined,
        deliveryLabelColor: deliveryLabelColor || undefined,
        promotionCycleStartDate: promotionCycleStartDate || undefined,
        promotionCycleFrequency: promotionCycleFrequency || undefined,
      });
      pushToast({
        title: "Sukces",
        description: "Ustawienia organizacji zostały zapisane",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać ustawień",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [name, description, category, logoUrl, deliveryDays, deliveryLabelColor, promotionCycleStartDate, promotionCycleFrequency]);

  const toggleDeliveryDay = (day: Weekday) => {
    setDeliveryDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const openRoleModal = (member: OrganisationMember) => {
    setSelectedMember(member);
    setNewRole(member.role === "OWNER" ? "MANAGER" : member.role as "MANAGER" | "ADMIN" | "EMPLOYEE");
    setRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedMember) return;

    try {
      const updated = await apiUpdateMemberRole(selectedMember.id, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? { ...m, role: updated.role } : m))
      );
      pushToast({
        title: "Sukces",
        description: "Rola użytkownika została zmieniona",
        variant: "success",
      });
      setRoleModalOpen(false);
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić roli użytkownika",
        variant: "error",
      });
    }
  };

  const formatMemberName = (member: OrganisationMember) => {
    const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
    return name || member.email;
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "OWNER":
        return "badge-brand";
      case "MANAGER":
        return "badge-success";
      case "ADMIN":
        return "badge-warning";
      default:
        return "badge-neutral";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Właściciel";
      case "MANAGER":
        return "Manager";
      case "ADMIN":
        return "Administrator";
      default:
        return "Pracownik";
    }
  };

  if (!hasSession) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Ładowanie ustawień organizacji...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label">Ustawienia</p>
        <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
          Organizacja
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 dark:from-brand-900/50 dark:to-brand-800/50 dark:text-brand-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="section-label">Informacje podstawowe</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Dane organizacji
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              Nazwa organizacji *
              <input
                type="text"
                className="input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa firmy"
              />
            </label>

            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              Opis
              <textarea
                className="input mt-1 min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis działalności"
              />
            </label>

            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              Branża / Kategoria
              <select
                className="input mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Wybierz kategorię</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Logo */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-violet-700 dark:from-violet-900/50 dark:to-violet-800/50 dark:text-violet-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Branding</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Logo organizacji
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              URL logo
              <input
                type="url"
                className="input mt-1"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </label>

            {logoUrl && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <p className="text-sm text-surface-600 dark:text-surface-300">Podgląd:</p>
                <div className="h-16 w-16 rounded-xl bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Settings - Delivery Days */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Ustawienia grafiku</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Dni dostawy (Żabka)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-3">
                Wybierz dni dostawy
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      deliveryDays.includes(key)
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-300"
                        : "bg-surface-50 border-surface-200 text-surface-600 hover:border-surface-300 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600"
                    }`}
                    onClick={() => toggleDeliveryDay(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              Kolor etykiety &quot;DOSTAWA&quot;
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  className="w-10 h-10 rounded-md border border-surface-200 dark:border-surface-700 cursor-pointer"
                  value={deliveryLabelColor}
                  onChange={(e) => setDeliveryLabelColor(e.target.value)}
                />
                <span className="text-sm text-surface-500 dark:text-surface-400">
                  {deliveryLabelColor}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Schedule Settings - Promotion Cycle */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 dark:from-amber-900/50 dark:to-amber-800/50 dark:text-amber-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Ustawienia grafiku</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Cykl promocji
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              Data rozpoczęcia cyklu
              <input
                type="date"
                className="input mt-1"
                value={promotionCycleStartDate}
                onChange={(e) => setPromotionCycleStartDate(e.target.value)}
              />
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Wybierz wtorek, od którego zaczyna się cykl promocji
              </p>
            </label>

            <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
              Częstotliwość (dni)
              <select
                className="input mt-1"
                value={promotionCycleFrequency}
                onChange={(e) => setPromotionCycleFrequency(Number(e.target.value))}
              >
                <option value={7}>Co tydzień</option>
                <option value={14}>Co 2 tygodnie</option>
                <option value={21}>Co 3 tygodnie</option>
                <option value={28}>Co 4 tygodnie</option>
              </select>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Pierwszy wtorek cyklu = &quot;ZMIANA PROMOCJI&quot;, następny = &quot;MAŁA PROMOCJA&quot;
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
      </div>

      {/* Members Management */}
      {user?.role === "OWNER" && (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Zarządzanie</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Członkowie organizacji
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
            <table className="min-w-full">
              <thead className="bg-surface-50/80 dark:bg-surface-900/80">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Użytkownik
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Rola
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={formatMemberName(member)}
                          src={member.avatarUrl}
                          size="sm"
                        />
                        <span className="font-medium text-surface-900 dark:text-surface-50">
                          {formatMemberName(member)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-300">
                      {member.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.role !== "OWNER" && (
                        <button
                          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                          onClick={() => openRoleModal(member)}
                        >
                          Zmień rolę
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      <Modal
        open={roleModalOpen}
        title="Zmień rolę użytkownika"
        description={selectedMember ? `Zmiana roli dla: ${formatMemberName(selectedMember)}` : ""}
        onClose={() => setRoleModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRoleModalOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleRoleChange}>
              Zapisz
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Nowa rola
            <select
              className="input mt-1"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "MANAGER" | "ADMIN" | "EMPLOYEE")}
            >
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrator</option>
              <option value="EMPLOYEE">Pracownik</option>
            </select>
          </label>

          <div className="text-sm text-surface-600 dark:text-surface-300">
            <p className="font-medium mb-2">Uprawnienia:</p>
            <ul className="list-disc list-inside space-y-1">
              {newRole === "MANAGER" && (
                <>
                  <li>Zarządzanie pracownikami</li>
                  <li>Edycja grafiku</li>
                  <li>Zatwierdzanie wniosków</li>
                </>
              )}
              {newRole === "ADMIN" && (
                <>
                  <li>Zarządzanie pracownikami</li>
                  <li>Edycja grafiku</li>
                  <li>Zatwierdzanie wniosków</li>
                  <li>Eksport raportów</li>
                </>
              )}
              {newRole === "EMPLOYEE" && (
                <li>Tylko podgląd własnych danych</li>
              )}
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

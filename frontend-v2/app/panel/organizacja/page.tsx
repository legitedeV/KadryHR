"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiCreateOrganisationLocation,
  apiDeactivateOrganisationMember,
  apiGetMe,
  apiGetOrganisationDetails,
  apiGetOrganisationLocations,
  apiGetOrganisationMembers,
  apiGetOrganisationScheduleSettings,
  apiInviteOrganisationMember,
  apiToggleOrganisationLocation,
  apiUpdateOrganisationDetails,
  apiUpdateOrganisationLocation,
  apiUpdateOrganisationMemberRole,
  apiUpdateOrganisationScheduleSettings,
  apiUploadOrganisationLogo,
  OrganisationDetails,
  OrganisationLocation,
  OrganisationMember,
  SchedulePeriodType,
  User,
  UserRole,
  Weekday,
} from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { pushToast } from "@/lib/toast";
import { Modal } from "@/components/Modal";
import {
  applyLocationUpdate,
  applyMemberRoleUpdate,
  validateCompanyForm,
} from "./organisation-settings.utils";

const TABS = [
  { id: "company", label: "Dane firmy" },
  { id: "locations", label: "Lokalizacje" },
  { id: "members", label: "Użytkownicy i role" },
  { id: "schedule", label: "Grafik i czas pracy" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WEEKDAY_OPTIONS: Array<{ value: Weekday; label: string }> = [
  { value: "MONDAY", label: "Pon" },
  { value: "TUESDAY", label: "Wt" },
  { value: "WEDNESDAY", label: "Śr" },
  { value: "THURSDAY", label: "Czw" },
  { value: "FRIDAY", label: "Pt" },
  { value: "SATURDAY", label: "Sob" },
  { value: "SUNDAY", label: "Nd" },
];

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Pracownik" },
];

function normalizeValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export default function OrganisationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organisation, setOrganisation] = useState<OrganisationDetails | null>(null);
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [members, setMembers] = useState<OrganisationMember[]>([]);

  const [companyForm, setCompanyForm] = useState({
    displayName: "",
    legalName: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    addressCountry: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    taxId: "",
    invoiceAddress: "",
    timezone: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});
  const [logoUploading, setLogoUploading] = useState(false);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OrganisationLocation | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    code: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    addressCountry: "",
    defaultOpeningTimeFrom: "",
    defaultOpeningTimeTo: "",
    isActive: true,
  });

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "EMPLOYEE" as UserRole,
    locationId: "",
  });
  const [inviting, setInviting] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    defaultWorkdayStart: "08:00",
    defaultWorkdayEnd: "16:00",
    defaultBreakMinutes: 30,
    workDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as Weekday[],
    schedulePeriod: "WEEKLY" as SchedulePeriodType,
  });
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const canAccess = useMemo(() => {
    if (!user) return false;
    return user.role === "OWNER" || user.role === "ADMIN";
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [me, organisationData, locationData, memberData, scheduleData] = await Promise.all([
        apiGetMe(),
        apiGetOrganisationDetails(),
        apiGetOrganisationLocations(),
        apiGetOrganisationMembers(),
        apiGetOrganisationScheduleSettings(),
      ]);

      setUser(me);
      setOrganisation(organisationData);
      setLocations(locationData);
      setMembers(memberData);
      setScheduleForm({
        defaultWorkdayStart: scheduleData.defaultWorkdayStart,
        defaultWorkdayEnd: scheduleData.defaultWorkdayEnd,
        defaultBreakMinutes: scheduleData.defaultBreakMinutes,
        workDays: scheduleData.workDays,
        schedulePeriod: scheduleData.schedulePeriod,
      });
      setCompanyForm({
        displayName: organisationData.displayName ?? organisationData.name ?? "",
        legalName: organisationData.legalName ?? "",
        addressStreet: organisationData.addressStreet ?? "",
        addressPostalCode: organisationData.addressPostalCode ?? "",
        addressCity: organisationData.addressCity ?? "",
        addressCountry: organisationData.addressCountry ?? "",
        contactEmail: organisationData.contactEmail ?? "",
        contactPhone: organisationData.contactPhone ?? "",
        websiteUrl: organisationData.websiteUrl ?? "",
        taxId: organisationData.taxId ?? "",
        invoiceAddress: organisationData.invoiceAddress ?? "",
        timezone: organisationData.timezone ?? "",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się pobrać danych organizacji";
      pushToast({
        title: "Błąd",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCompanySave = useCallback(async () => {
    const errors = validateCompanyForm({
      displayName: companyForm.displayName,
      addressCity: companyForm.addressCity,
      taxId: companyForm.taxId,
    });

    setCompanyErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast({
        title: "Uzupełnij wymagane pola",
        description: "Nazwa wyświetlana, miasto i NIP są wymagane.",
        variant: "warning",
      });
      return;
    }

    setSavingCompany(true);
    try {
      const payload: Partial<OrganisationDetails> & { name?: string } = {
        name: normalizeValue(companyForm.displayName) ?? organisation?.name,
        displayName: normalizeValue(companyForm.displayName),
        legalName: normalizeValue(companyForm.legalName),
        addressStreet: normalizeValue(companyForm.addressStreet),
        addressPostalCode: normalizeValue(companyForm.addressPostalCode),
        addressCity: normalizeValue(companyForm.addressCity),
        addressCountry: normalizeValue(companyForm.addressCountry),
        contactEmail: normalizeValue(companyForm.contactEmail),
        contactPhone: normalizeValue(companyForm.contactPhone),
        websiteUrl: normalizeValue(companyForm.websiteUrl),
        taxId: normalizeValue(companyForm.taxId),
        invoiceAddress: normalizeValue(companyForm.invoiceAddress),
        timezone: normalizeValue(companyForm.timezone),
      };

      const updated = await apiUpdateOrganisationDetails(payload);
      setOrganisation(updated);
      pushToast({
        title: "Zapisano",
        description: "Dane organizacji zostały zaktualizowane.",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się zapisać danych";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setSavingCompany(false);
    }
  }, [companyForm, organisation]);

  const handleLogoUpload = useCallback(async (file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      pushToast({
        title: "Nieprawidłowy format",
        description: "Dozwolone: PNG, JPG, WEBP.",
        variant: "error",
      });
      return;
    }

    setLogoUploading(true);
    try {
      const response = await apiUploadOrganisationLogo(file);
      setOrganisation((prev) => (prev ? { ...prev, logoUrl: response.logoUrl } : prev));
      pushToast({
        title: "Logo zaktualizowane",
        description: "Nowe logo zostało zapisane.",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się przesłać logo";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setLogoUploading(false);
    }
  }, []);

  const openLocationModal = useCallback((location?: OrganisationLocation) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        name: location.name,
        code: location.code ?? "",
        addressStreet: location.addressStreet ?? "",
        addressPostalCode: location.addressPostalCode ?? "",
        addressCity: location.addressCity ?? "",
        addressCountry: location.addressCountry ?? "",
        defaultOpeningTimeFrom: location.defaultOpeningTimeFrom ?? "",
        defaultOpeningTimeTo: location.defaultOpeningTimeTo ?? "",
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        name: "",
        code: "",
        addressStreet: "",
        addressPostalCode: "",
        addressCity: "",
        addressCountry: "",
        defaultOpeningTimeFrom: "",
        defaultOpeningTimeTo: "",
        isActive: true,
      });
    }
    setLocationModalOpen(true);
  }, []);

  const handleSaveLocation = useCallback(async () => {
    if (!locationForm.name.trim()) {
      pushToast({
        title: "Wymagana nazwa",
        description: "Podaj nazwę lokalizacji.",
        variant: "warning",
      });
      return;
    }

    setLocationSaving(true);
    try {
      if (editingLocation) {
        const updated = await apiUpdateOrganisationLocation(editingLocation.id, {
          ...locationForm,
        });
        setLocations((prev) => applyLocationUpdate(prev, updated, "update"));
        pushToast({ title: "Zapisano", description: "Lokalizacja zaktualizowana.", variant: "success" });
      } else {
        const created = await apiCreateOrganisationLocation({
          ...locationForm,
          name: locationForm.name,
        });
        setLocations((prev) => applyLocationUpdate(prev, created, "create"));
        pushToast({ title: "Dodano", description: "Lokalizacja została utworzona.", variant: "success" });
      }
      setLocationModalOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się zapisać lokalizacji";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setLocationSaving(false);
    }
  }, [editingLocation, locationForm]);

  const handleToggleLocation = useCallback(
    async (location: OrganisationLocation) => {
      if (location.isActive) {
        const confirmed = window.confirm(
          "Czy na pewno chcesz dezaktywować lokalizację? Upewnij się, że nie ma aktywnych grafików/pracowników.",
        );
        if (!confirmed) return;
      }
      try {
        const updated = await apiToggleOrganisationLocation(location.id);
        setLocations((prev) => prev.map((loc) => (loc.id === updated.id ? updated : loc)));
        pushToast({
          title: updated.isActive ? "Aktywowano" : "Dezaktywowano",
          description: "Status lokalizacji został zmieniony.",
          variant: "success",
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Nie udało się zmienić statusu";
        pushToast({ title: "Błąd", description: message, variant: "error" });
      }
    },
    [],
  );

  const handleInviteMember = useCallback(async () => {
    if (!inviteForm.email.trim()) {
      pushToast({ title: "Podaj e-mail", description: "Wpisz adres e-mail zapraszanej osoby.", variant: "warning" });
      return;
    }

    setInviting(true);
    try {
      await apiInviteOrganisationMember({
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        locationId: inviteForm.locationId || undefined,
      });
      setInviteForm({ email: "", role: inviteForm.role, locationId: "" });
      pushToast({
        title: "Zaproszenie wysłane",
        description: "Nowy użytkownik otrzymał wiadomość e-mail.",
        variant: "success",
      });
      const refreshed = await apiGetOrganisationMembers();
      setMembers(refreshed);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się wysłać zaproszenia";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setInviting(false);
    }
  }, [inviteForm]);

  const handleRoleChange = useCallback(
    async (memberId: string, role: UserRole) => {
      try {
        const updated = await apiUpdateOrganisationMemberRole(memberId, role);
        setMembers((prev) => applyMemberRoleUpdate(prev, { id: updated.id, role: updated.role }));
        pushToast({ title: "Zaktualizowano", description: "Rola została zmieniona.", variant: "success" });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Nie udało się zmienić roli";
        pushToast({ title: "Błąd", description: message, variant: "error" });
      }
    },
    [],
  );

  const handleDeactivateMember = useCallback(async (member: OrganisationMember) => {
    const confirmed = window.confirm(`Czy na pewno chcesz dezaktywować ${member.email}?`);
    if (!confirmed) return;
    try {
      await apiDeactivateOrganisationMember(member.id);
      setMembers((prev) => prev.filter((item) => item.id !== member.id));
      pushToast({ title: "Dezaktywowano", description: "Użytkownik został usunięty.", variant: "success" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się dezaktywować użytkownika";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    }
  }, []);

  const handleScheduleSave = useCallback(async () => {
    setScheduleSaving(true);
    try {
      const updated = await apiUpdateOrganisationScheduleSettings({
        defaultWorkdayStart: scheduleForm.defaultWorkdayStart,
        defaultWorkdayEnd: scheduleForm.defaultWorkdayEnd,
        defaultBreakMinutes: scheduleForm.defaultBreakMinutes,
        workDays: scheduleForm.workDays,
        schedulePeriod: scheduleForm.schedulePeriod,
      });
      pushToast({ title: "Zapisano", description: "Ustawienia grafiku zostały zapisane.", variant: "success" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nie udało się zapisać ustawień";
      pushToast({ title: "Błąd", description: message, variant: "error" });
    } finally {
      setScheduleSaving(false);
    }
  }, [scheduleForm]);

  if (loading) {
    return <div className="text-sm text-surface-600">Ładowanie ustawień organizacji...</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-[var(--panel-card-border)] bg-[var(--panel-card-bg)] p-6 text-sm text-surface-600">
        Brak uprawnień do wyświetlenia ustawień organizacji.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr] min-h-[calc(100vh-12rem)]">
      <aside className="rounded-xl border border-[var(--panel-card-border)] bg-[var(--panel-card-bg)] p-3 shadow-sm h-fit">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Panel</p>
        <div className="mt-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--accent-soft)] text-[var(--text-main)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--accent)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-xl border border-[var(--panel-card-border)] bg-[var(--panel-card-bg)] shadow-sm p-4 min-h-[520px]">
        {activeTab === "company" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">Dane firmy</p>
                <p className="text-xs text-[var(--text-muted)]">Aktualizuj podstawowe dane i informacje do faktur.</p>
              </div>
              <button className="panel-button-primary" onClick={handleCompanySave} disabled={savingCompany}>
                {savingCompany ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="rounded-lg border border-[var(--panel-card-border)] bg-[var(--bg-page)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">Logo</p>
                <div className="mt-3 flex flex-col items-center gap-3">
                  <div className="h-24 w-24 rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--panel-card-bg)] flex items-center justify-center overflow-hidden">
                    {organisation?.logoUrl ? (
                      <img src={organisation.logoUrl} alt="Logo organizacji" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Brak logo</span>
                    )}
                  </div>
                  <label className="panel-button cursor-pointer text-xs">
                    {logoUploading ? "Wysyłanie..." : "Dodaj logo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                      disabled={logoUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-[var(--text-muted)]">
                  Nazwa wyświetlana
                  <input
                    className={`panel-input mt-1 ${companyErrors.displayName ? "border-red-500" : ""}`}
                    value={companyForm.displayName}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  />
                  {companyErrors.displayName && <span className="text-xs text-red-400">{companyErrors.displayName}</span>}
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Pełna nazwa
                  <input
                    className="panel-input mt-1"
                    value={companyForm.legalName}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, legalName: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Ulica i numer
                  <input
                    className="panel-input mt-1"
                    value={companyForm.addressStreet}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, addressStreet: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Kod pocztowy
                  <input
                    className="panel-input mt-1"
                    value={companyForm.addressPostalCode}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, addressPostalCode: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Miasto
                  <input
                    className={`panel-input mt-1 ${companyErrors.addressCity ? "border-red-500" : ""}`}
                    value={companyForm.addressCity}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, addressCity: e.target.value }))}
                  />
                  {companyErrors.addressCity && <span className="text-xs text-red-400">{companyErrors.addressCity}</span>}
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Kraj
                  <input
                    className="panel-input mt-1"
                    value={companyForm.addressCountry}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, addressCountry: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  E-mail kontaktowy
                  <input
                    className="panel-input mt-1"
                    value={companyForm.contactEmail}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Telefon
                  <input
                    className="panel-input mt-1"
                    value={companyForm.contactPhone}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Strona WWW
                  <input
                    className="panel-input mt-1"
                    value={companyForm.websiteUrl}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  NIP / VAT ID
                  <input
                    className={`panel-input mt-1 ${companyErrors.taxId ? "border-red-500" : ""}`}
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, taxId: e.target.value }))}
                  />
                  {companyErrors.taxId && <span className="text-xs text-red-400">{companyErrors.taxId}</span>}
                </label>
                <label className="text-xs text-[var(--text-muted)] md:col-span-2">
                  Adres do faktur (jeśli inny)
                  <input
                    className="panel-input mt-1"
                    value={companyForm.invoiceAddress}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, invoiceAddress: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  Strefa czasowa
                  <input
                    className="panel-input mt-1"
                    value={companyForm.timezone}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, timezone: e.target.value }))}
                    placeholder="Europe/Warsaw"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "locations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">Lokalizacje</p>
                <p className="text-xs text-[var(--text-muted)]">Zarządzaj oddziałami i godzinami pracy.</p>
              </div>
              <button className="panel-button-primary" onClick={() => openLocationModal()}>
                Dodaj lokalizację
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--panel-card-border)]">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-[var(--bg-page)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <span>Nazwa</span>
                <span>Kod</span>
                <span>Miasto</span>
                <span>Status</span>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {locations.length === 0 && (
                  <div className="p-4 text-sm text-[var(--text-muted)]">Brak lokalizacji. Dodaj pierwszą.</div>
                )}
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 border-t border-[var(--panel-card-border)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-main)]">{location.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {location.addressStreet || "Brak adresu"}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{location.code || "-"}</span>
                    <span className="text-xs text-[var(--text-muted)]">{location.addressCity || "-"}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${location.isActive ? "text-emerald-400" : "text-red-400"}`}>
                        {location.isActive ? "Aktywna" : "Nieaktywna"}
                      </span>
                      <button className="panel-button text-xs" onClick={() => openLocationModal(location)}>
                        Edytuj
                      </button>
                      <button className="panel-button text-xs" onClick={() => handleToggleLocation(location)}>
                        {location.isActive ? "Dezaktywuj" : "Aktywuj"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-main)]">Użytkownicy i role</p>
              <p className="text-xs text-[var(--text-muted)]">Zmieniaj role i zapraszaj nowe osoby.</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
              <label className="text-xs text-[var(--text-muted)]">
                E-mail
                <input
                  className="panel-input mt-1"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@firma.pl"
                />
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Rola
                <select
                  className="panel-input mt-1"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Lokalizacja
                <select
                  className="panel-input mt-1"
                  value={inviteForm.locationId}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, locationId: e.target.value }))}
                >
                  <option value="">Brak</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-xs text-[var(--text-muted)]">
                Zaproszenie wyśle link do ustawienia hasła.
              </div>
              <button className="panel-button-primary" onClick={handleInviteMember} disabled={inviting}>
                {inviting ? "Wysyłanie..." : "Wyślij"}
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--panel-card-border)]">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] bg-[var(--bg-page)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <span>Użytkownik</span>
                <span>Rola</span>
                <span>Status</span>
                <span>Akcje</span>
                <span></span>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-2 border-t border-[var(--panel-card-border)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-main)]">
                        {member.firstName || member.lastName ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() : member.email}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                    </div>
                    <div>
                      {member.role === "OWNER" ? (
                        <span className="text-xs font-semibold text-amber-400">OWNER</span>
                      ) : (
                        <select
                          className="panel-input text-xs"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${member.status === "ACTIVE" ? "text-emerald-400" : "text-amber-400"}`}>
                      {member.status === "ACTIVE" ? "Aktywny" : "Zaproszony"}
                    </span>
                    <div>
                      <button className="panel-button text-xs" onClick={() => handleDeactivateMember(member)}>
                        Dezaktywuj
                      </button>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {member.role === "OWNER" && "Chroniony"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">Grafik i czas pracy</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Domyślne ustawienia harmonogramu – można je nadpisywać w konkretnych grafikach.
                </p>
              </div>
              <button className="panel-button-primary" onClick={handleScheduleSave} disabled={scheduleSaving}>
                {scheduleSaving ? "Zapisywanie..." : "Zapisz"}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="text-xs text-[var(--text-muted)]">
                Start pracy
                <input
                  type="time"
                  className="panel-input mt-1"
                  value={scheduleForm.defaultWorkdayStart}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, defaultWorkdayStart: e.target.value }))}
                />
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Koniec pracy
                <input
                  type="time"
                  className="panel-input mt-1"
                  value={scheduleForm.defaultWorkdayEnd}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, defaultWorkdayEnd: e.target.value }))}
                />
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Przerwa (min)
                <input
                  type="number"
                  className="panel-input mt-1"
                  min={0}
                  max={480}
                  value={scheduleForm.defaultBreakMinutes}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, defaultBreakMinutes: Number(e.target.value) }))}
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-lg border border-[var(--panel-card-border)] bg-[var(--bg-page)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">Dni robocze</p>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {WEEKDAY_OPTIONS.map((day) => (
                    <label key={day.value} className="flex flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
                      <input
                        type="checkbox"
                        checked={scheduleForm.workDays.includes(day.value)}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            workDays: e.target.checked
                              ? [...prev.workDays, day.value]
                              : prev.workDays.filter((item) => item !== day.value),
                          }))
                        }
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="text-xs text-[var(--text-muted)]">
                Okres planowania
                <select
                  className="panel-input mt-1"
                  value={scheduleForm.schedulePeriod}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, schedulePeriod: e.target.value as SchedulePeriodType }))}
                >
                  <option value="WEEKLY">Tydzień</option>
                  <option value="MONTHLY">Miesiąc</option>
                  <option value="FOUR_WEEKS">4 tygodnie</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title={editingLocation ? "Edytuj lokalizację" : "Nowa lokalizacja"}
        description="Uzupełnij dane lokalizacji i domyślne godziny."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-[var(--text-muted)]">
            Nazwa
            <input
                className="panel-input mt-1"
                value={locationForm.name}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Kod
              <input
                className="panel-input mt-1"
                value={locationForm.code}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, code: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Ulica i numer
              <input
                className="panel-input mt-1"
                value={locationForm.addressStreet}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, addressStreet: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Kod pocztowy
              <input
                className="panel-input mt-1"
                value={locationForm.addressPostalCode}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, addressPostalCode: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Miasto
              <input
                className="panel-input mt-1"
                value={locationForm.addressCity}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, addressCity: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Kraj
              <input
                className="panel-input mt-1"
                value={locationForm.addressCountry}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, addressCountry: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Godzina otwarcia
              <input
                type="time"
                className="panel-input mt-1"
                value={locationForm.defaultOpeningTimeFrom}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, defaultOpeningTimeFrom: e.target.value }))}
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Godzina zamknięcia
              <input
                type="time"
                className="panel-input mt-1"
              value={locationForm.defaultOpeningTimeTo}
              onChange={(e) => setLocationForm((prev) => ({ ...prev, defaultOpeningTimeTo: e.target.value }))}
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button className="panel-button" onClick={() => setLocationModalOpen(false)}>
            Anuluj
          </button>
          <button className="panel-button-primary" onClick={handleSaveLocation} disabled={locationSaving}>
            {locationSaving ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

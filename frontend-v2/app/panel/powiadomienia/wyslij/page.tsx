"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  NotificationChannel,
  NotificationType,
  AudienceFilter,
  UserRole,
  apiCreateCampaign,
  apiSendCampaign,
  apiListLocations,
  apiListEmployees,
  LocationRecord,
  EmployeeRecord,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { usePermissions } from "@/lib/use-permissions";

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "CUSTOM", label: "Niestandardowe" },
  { value: "LEAVE_STATUS", label: "Status wniosku" },
  { value: "SHIFT_ASSIGNMENT", label: "Grafik / zmiany" },
  { value: "SCHEDULE_PUBLISHED", label: "Opublikowany grafik" },
  { value: "SWAP_STATUS", label: "Status zamiany" },
];

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: "IN_APP", label: "Aplikacja" },
  { value: "EMAIL", label: "Email" },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "EMPLOYEE", label: "Pracownicy" },
  { value: "MANAGER", label: "Menedżerowie" },
  { value: "OWNER", label: "Właściciele" },
];

export default function CampaignComposerPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("CUSTOM");
  const [channels, setChannels] = useState<NotificationChannel[]>(["IN_APP"]);
  
  // Audience filter
  const [audienceAll, setAudienceAll] = useState(true);
  const [audienceRoles, setAudienceRoles] = useState<UserRole[]>([]);
  const [audienceLocationIds, setAudienceLocationIds] = useState<string[]>([]);
  const [audienceEmployeeIds, setAudienceEmployeeIds] = useState<string[]>([]);

  // Available options
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const canManage = hasPermission("EMPLOYEE_MANAGE"); // Managers and owners have this permission

  // Load locations and employees
  useEffect(() => {
    if (!canManage) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [locs, emps] = await Promise.all([
          apiListLocations(),
          apiListEmployees(),
        ]);
        setLocations(locs);
        setEmployees(emps);
      } catch (err) {
        console.error("Failed to load options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [canManage]);

  if (!canManage) {
    return (
      <div className="space-y-4">
        <div className="card p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nie masz uprawnień do wysyłania powiadomień.
          </p>
        </div>
      </div>
    );
  }

  const handleChannelToggle = (channel: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleRoleToggle = (role: UserRole) => {
    setAudienceRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleLocationToggle = (locationId: string) => {
    setAudienceLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setAudienceEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const createDraft = async () => {
    if (!title.trim()) {
      pushToast({
        title: "Błąd",
        description: "Tytuł jest wymagany.",
        variant: "error",
      });
      return;
    }

    if (channels.length === 0) {
      pushToast({
        title: "Błąd",
        description: "Wybierz przynajmniej jeden kanał.",
        variant: "error",
      });
      return;
    }

    const audienceFilter: AudienceFilter = audienceAll
      ? { all: true }
      : {
          roles: audienceRoles.length > 0 ? audienceRoles : undefined,
          locationIds: audienceLocationIds.length > 0 ? audienceLocationIds : undefined,
          employeeIds: audienceEmployeeIds.length > 0 ? audienceEmployeeIds : undefined,
        };

    if (
      !audienceAll &&
      !audienceFilter.roles?.length &&
      !audienceFilter.locationIds?.length &&
      !audienceFilter.employeeIds?.length
    ) {
      pushToast({
        title: "Błąd",
        description: "Wybierz przynajmniej jedną opcję targetowania lub zaznacz 'Wszyscy'.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const campaign = await apiCreateCampaign({
        title,
        body: body.trim() || undefined,
        type,
        channels,
        audienceFilter,
      });

      setDraftCampaignId(campaign.id);
      pushToast({
        title: "Zapisano",
        description: "Szkic kampanii został utworzony.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się utworzyć szkicu kampanii.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendConfirm = async () => {
    // Ensure draft is created first
    let campaignId = draftCampaignId;
    if (!campaignId) {
      await createDraft();
      // Note: createDraft sets draftCampaignId state, but we need to wait for that
      // In practice, users should click "Zapisz szkic" before sending
      // This is a fallback to create if they skip that step
      return; // Exit and let user try again after draft is created
    }

    setSending(true);
    try {
      const result = await apiSendCampaign(campaignId);
      pushToast({
        title: "Wysłano",
        description: `Powiadomienie zostało wysłane do ${result.recipientCount} odbiorców.`,
        variant: "success",
      });
      setShowConfirmModal(false);
      router.push("/panel/powiadomienia/historia");
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się wysłać kampanii.",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
          Powiadomienia
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Wyślij powiadomienie
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Twórz i wysyłaj powiadomienia do użytkowników w organizacji
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Tytuł powiadomienia *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                placeholder="np. Ważna informacja dla zespołu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Treść
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                placeholder="Treść powiadomienia..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Typ powiadomienia
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Kanały dostarczania *
              </label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={channels.includes(option.value)}
                      onChange={() => handleChannelToggle(option.value)}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Odbiorcy
              </label>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={audienceAll}
                  onChange={(e) => {
                    setAudienceAll(e.target.checked);
                    if (e.target.checked) {
                      setAudienceRoles([]);
                      setAudienceLocationIds([]);
                      setAudienceEmployeeIds([]);
                    }
                  }}
                />
                <span className="text-sm">Wszyscy w organizacji</span>
              </label>

              {!audienceAll && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Wybierz role:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={audienceRoles.includes(option.value)}
                          onChange={() => handleRoleToggle(option.value)}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 mt-4">
                    Wybierz lokalizacje:
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loadingOptions ? (
                      <p className="text-xs text-slate-500">Ładowanie...</p>
                    ) : locations.length === 0 ? (
                      <p className="text-xs text-slate-500">Brak lokalizacji</p>
                    ) : (
                      locations.map((location) => (
                        <label
                          key={location.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={audienceLocationIds.includes(location.id)}
                            onChange={() => handleLocationToggle(location.id)}
                          />
                          <span className="text-sm">{location.name}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 mt-4">
                    Wybierz pracowników:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {loadingOptions ? (
                      <p className="text-xs text-slate-500">Ładowanie...</p>
                    ) : employees.length === 0 ? (
                      <p className="text-xs text-slate-500">Brak pracowników</p>
                    ) : (
                      employees.map((employee) => {
                        const empName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
                        return (
                          <label
                            key={employee.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                          >
                            <input
                              type="checkbox"
                              checked={audienceEmployeeIds.includes(employee.id)}
                              onChange={() => handleEmployeeToggle(employee.id)}
                            />
                            <span className="text-sm">
                              {empName || employee.email || "Bez nazwy"}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {showPreview && (
            <div className="card p-4">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-2">
                Podgląd
              </p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {title || "(Brak tytułu)"}
                </p>
                {body && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {body}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {channels.map((ch) => (
                    <span
                      key={ch}
                      className="text-[11px] px-2 py-1 rounded-full border border-slate-200 dark:border-slate-800"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <p>
                    <strong>Odbiorcy:</strong>{" "}
                    {audienceAll
                      ? "Wszyscy w organizacji"
                      : [
                          audienceRoles.length > 0 && `Role: ${audienceRoles.length}`,
                          audienceLocationIds.length > 0 && `Lokalizacje: ${audienceLocationIds.length}`,
                          audienceEmployeeIds.length > 0 && `Pracownicy: ${audienceEmployeeIds.length}`,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Brak filtrów"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {showPreview ? "Ukryj podgląd" : "Pokaż podgląd"}
            </button>

            <button
              type="button"
              onClick={createDraft}
              disabled={loading || !!draftCampaignId}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {loading ? "Zapisywanie..." : draftCampaignId ? "Szkic zapisany" : "Zapisz szkic"}
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={!draftCampaignId && !title.trim()}
              className="w-full btn-primary px-3 py-2 rounded-xl disabled:opacity-50"
            >
              Wyślij powiadomienie
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Potwierdź wysyłkę
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Czy na pewno chcesz wysłać to powiadomienie do{" "}
              {audienceAll ? "wszystkich użytkowników" : `wybranych odbiorców`}?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={sending}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSendConfirm}
                disabled={sending}
                className="flex-1 btn-primary px-3 py-2 rounded-xl disabled:opacity-50"
              >
                {sending ? "Wysyłanie..." : "Wyślij"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

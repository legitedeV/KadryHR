"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  apiGetMe,
  apiGetProfile,
  apiUpdateProfile,
  apiChangePassword,
  apiChangeEmail,
  apiGetNotificationPreferences,
  apiUpdateNotificationPreferences,
  User,
  UserProfile,
  NotificationPreference,
} from "@/lib/api";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { pushToast } from "@/lib/toast";
import { Avatar } from "@/components/Avatar";
import { Modal } from "@/components/Modal";

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  TEST: "Testowe",
  LEAVE_STATUS: "Zmiany statusu urlopu",
  SHIFT_ASSIGNMENT: "Przypisanie zmiany",
  SCHEDULE_PUBLISHED: "Publikacja grafiku",
  SWAP_STATUS: "Zamiany zmian",
  CUSTOM: "Powiadomienia niestandardowe",
};

export default function ProfilPage() {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Change email state
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Notification preferences state
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([
      apiGetMe(),
      apiGetProfile(),
      apiGetNotificationPreferences(),
    ])
      .then(([userData, profileData, prefsData]) => {
        if (cancelled) return;
        setUser(userData);
        setProfile(profileData);
        setPreferences(prefsData);

        // Initialize edit form
        setFirstName(profileData.firstName ?? "");
        setLastName(profileData.lastName ?? "");
        setAvatarUrl(profileData.avatarUrl ?? "");
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Nie udało się pobrać profilu");
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

  const handleSaveProfile = useCallback(async () => {
    setSavingProfile(true);
    try {
      const updated = await apiUpdateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfile(updated);
      setEditProfileOpen(false);
      pushToast({
        title: "Sukces",
        description: "Profil został zaktualizowany",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zaktualizować profilu",
        variant: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  }, [firstName, lastName, avatarUrl]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      pushToast({
        title: "Błąd",
        description: "Hasła nie są takie same",
        variant: "error",
      });
      return;
    }

    if (newPassword.length < 8) {
      pushToast({
        title: "Błąd",
        description: "Nowe hasło musi mieć co najmniej 8 znaków",
        variant: "error",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await apiChangePassword({
        currentPassword,
        newPassword,
      });
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      pushToast({
        title: "Sukces",
        description: "Hasło zostało zmienione",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nieprawidłowe aktualne hasło",
        variant: "error",
      });
    } finally {
      setSavingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleChangeEmail = useCallback(async () => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      pushToast({
        title: "Błąd",
        description: "Podaj prawidłowy adres e-mail",
        variant: "error",
      });
      return;
    }

    setSavingEmail(true);
    try {
      const updated = await apiChangeEmail({
        currentPassword: emailPassword,
        newEmail,
      });
      setProfile(updated);
      setChangeEmailOpen(false);
      setEmailPassword("");
      setNewEmail("");
      pushToast({
        title: "Sukces",
        description: "Adres e-mail został zmieniony",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić adresu e-mail",
        variant: "error",
      });
    } finally {
      setSavingEmail(false);
    }
  }, [emailPassword, newEmail]);

  const handleTogglePreference = useCallback(
    async (type: string, field: "inApp" | "email" | "sms", value: boolean) => {
      const updated = preferences.map((p) =>
        p.type === type ? { ...p, [field]: value } : p
      );
      setPreferences(updated);

      setSavingPreferences(true);
      try {
        await apiUpdateNotificationPreferences(updated);
        pushToast({
          title: "Sukces",
          description: "Preferencje zostały zapisane",
          variant: "success",
        });
      } catch (err) {
        console.error(err);
        // Revert on error
        setPreferences(preferences);
        pushToast({
          title: "Błąd",
          description: "Nie udało się zapisać preferencji",
          variant: "error",
        });
      } finally {
        setSavingPreferences(false);
      }
    },
    [preferences]
  );

  const formatName = (p?: UserProfile | null) => {
    if (!p) return "";
    return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
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
        Ładowanie profilu...
      </div>
    );
  }

  if (error || !user || !profile) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {error || "Brak danych"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Profil</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">Dane zalogowanego użytkownika</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="card p-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              name={formatName(profile)}
              src={profile.avatarUrl}
              size="md"
              className="h-16 w-16 text-2xl"
            />
            <div className="flex-1">
              <p className="section-label">Podstawowe dane</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1">
                {formatName(profile)}
              </p>
            </div>
            <button
              className="btn-secondary text-sm"
              onClick={() => {
                setFirstName(profile.firstName ?? "");
                setLastName(profile.lastName ?? "");
                setAvatarUrl(profile.avatarUrl ?? "");
                setEditProfileOpen(true);
              }}
            >
              Edytuj
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">E-mail</p>
                <p className="font-semibold text-surface-900 dark:text-surface-50">{profile.email}</p>
              </div>
              <button
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                onClick={() => {
                  setNewEmail("");
                  setEmailPassword("");
                  setChangeEmailOpen(true);
                }}
              >
                Zmień
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Rola</p>
                <p className="font-semibold text-surface-900 dark:text-surface-50">{getRoleLabel(profile.role)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Organizacja</p>
                <p className="font-semibold text-surface-900 dark:text-surface-50">{profile.organisation.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Bezpieczeństwo</p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
                Ustawienia konta
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-50">Hasło</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Ostatnio zmienione: nie dotyczy
                </p>
              </div>
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setChangePasswordOpen(true);
                }}
              >
                Zmień hasło
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-50">Sesja</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Wyloguj się na wspólnych urządzeniach
                </p>
              </div>
              <button
                onClick={() => {
                  clearAuthTokens();
                  router.push("/login");
                }}
                className="btn-secondary text-sm"
              >
                Wyloguj
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-50">Uwierzytelnianie dwuskładnikowe (2FA)</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Dodatkowa warstwa bezpieczeństwa dla Twojego konta
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-accent-900/30 text-accent-300">
                  Wkrótce dostępne
                </span>
                <button
                  disabled
                  className="btn-secondary text-sm opacity-50 cursor-not-allowed"
                  title="Funkcja w przygotowaniu"
                >
                  Włącz 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p className="section-label">Preferencje</p>
            <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
              Powiadomienia
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-200/80 dark:border-surface-800/80">
          <table className="min-w-full">
            <thead className="bg-surface-50/80 dark:bg-surface-900/80">
              <tr className="border-b border-surface-200 dark:border-surface-800">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Typ powiadomienia
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  W aplikacji
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  E-mail
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  <span className="flex items-center justify-center gap-1">
                    SMS
                    <span className="text-[9px] font-normal normal-case text-amber-600 dark:text-amber-400">(beta)</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900/50">
              {preferences.map((pref) => (
                <tr key={pref.type} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-surface-900 dark:text-surface-50">
                    {NOTIFICATION_TYPE_LABELS[pref.type] ?? pref.type}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={savingPreferences}
                      onClick={() => handleTogglePreference(pref.type, "inApp", !pref.inApp)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pref.inApp ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pref.inApp ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={savingPreferences}
                      onClick={() => handleTogglePreference(pref.type, "email", !pref.email)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pref.email ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pref.email ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={savingPreferences}
                      onClick={() => handleTogglePreference(pref.type, "sms", !pref.sms)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pref.sms ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pref.sms ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
          💡 <strong>SMS:</strong> Wymaga skonfigurowanego numeru telefonu. Usługa w wersji beta.
        </p>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editProfileOpen}
        title="Edytuj profil"
        description="Zmień swoje dane osobowe"
        onClose={() => setEditProfileOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditProfileOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "Zapisywanie..." : "Zapisz"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Imię
            <input
              type="text"
              className="input mt-1"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jan"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Nazwisko
            <input
              type="text"
              className="input mt-1"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Kowalski"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            URL avatara
            <input
              type="url"
              className="input mt-1"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </label>

          {avatarUrl && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
              <p className="text-sm text-surface-600 dark:text-surface-300">Podgląd:</p>
              <Avatar name={`${firstName} ${lastName}`} src={avatarUrl} size="md" />
            </div>
          )}
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={changePasswordOpen}
        title="Zmień hasło"
        description="Wprowadź aktualne i nowe hasło"
        onClose={() => setChangePasswordOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setChangePasswordOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? "Zapisywanie..." : "Zmień hasło"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Aktualne hasło
            <input
              type="password"
              className="input mt-1"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Nowe hasło
            <input
              type="password"
              className="input mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 znaków"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Potwierdź nowe hasło
            <input
              type="password"
              className="input mt-1"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        </div>
      </Modal>

      {/* Change Email Modal */}
      <Modal
        open={changeEmailOpen}
        title="Zmień adres e-mail"
        description="Wprowadź hasło i nowy adres e-mail"
        onClose={() => setChangeEmailOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setChangeEmailOpen(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleChangeEmail} disabled={savingEmail}>
              {savingEmail ? "Zapisywanie..." : "Zmień e-mail"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Aktualne hasło
            <input
              type="password"
              className="input mt-1"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
            Nowy adres e-mail
            <input
              type="email"
              className="input mt-1"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nowy@email.pl"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

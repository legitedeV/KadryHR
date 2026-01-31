"use client";

import { useEffect, useMemo, useState, useCallback, useRef, type PointerEvent, type SyntheticEvent } from "react";
import {
  apiGetMe,
  apiGetProfile,
  apiUpdateProfile,
  apiChangePassword,
  apiChangeEmail,
  apiUploadAvatar,
  User,
  UserProfile,
} from "@/lib/api";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { type CropArea, getCroppedImageBlob } from "@/lib/image-crop";
import { useRouter } from "next/navigation";
import { pushToast } from "@/lib/toast";
import { Avatar } from "@/components/Avatar";
import { Modal } from "@/components/Modal";

export default function ProfilPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState(0);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

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

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([apiGetMe(), apiGetProfile()])
      .then(([userData, profileData]) => {
        if (cancelled) return;
        setUser(userData);
        setProfile(profileData);

        // Initialize edit form
        setFirstName(profileData.firstName ?? "");
        setLastName(profileData.lastName ?? "");
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
  }, [firstName, lastName]);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const resetAvatarSelection = useCallback(() => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setImageSize(null);
    setContainerSize(0);
    setAvatarEditorOpen(false);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }, []);

  const buildAvatarUrl = useCallback((url?: string | null, updatedAt?: string | null) => {
    if (!url) return url ?? null;
    const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${version}`;
  }, []);

  const handleAvatarSelect = useCallback((file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      pushToast({
        title: "Błąd",
        description: "Dozwolone formaty: PNG, JPG, WEBP.",
        variant: "error",
      });
      return;
    }

    if (file.size > maxSize) {
      pushToast({
        title: "Błąd",
        description: "Plik jest za duży. Maksymalnie 5 MB.",
        variant: "error",
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setImageSize(null);
    setCropOffset({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setAvatarEditorOpen(true);
  }, []);

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile || !avatarPreview || !croppedAreaPixels) return;
    setUploadingAvatar(true);
    try {
      const croppedBlob = await getCroppedImageBlob(avatarPreview, croppedAreaPixels, {
        outputSize: 512,
        mimeType: "image/jpeg",
        quality: 0.85,
      });
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: croppedBlob.type });
      const response = await apiUploadAvatar(croppedFile);
      setProfile((prev) => {
        if (!prev) return prev;
        if (response.profile) {
          return {
            ...response.profile,
            avatarUrl: buildAvatarUrl(response.profile.avatarUrl, response.avatarUpdatedAt ?? response.profile.avatarUpdatedAt),
            avatarUpdatedAt: response.avatarUpdatedAt ?? response.profile.avatarUpdatedAt,
          };
        }
        return {
          ...prev,
          avatarUrl: buildAvatarUrl(response.avatarUrl, response.avatarUpdatedAt ?? prev.avatarUpdatedAt),
          avatarUpdatedAt: response.avatarUpdatedAt ?? prev.avatarUpdatedAt,
        };
      });
      await refresh();
      resetAvatarSelection();
      pushToast({
        title: "Sukces",
        description: "Zdjęcie profilowe zostało zaktualizowane",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      let description = "Nie udało się przesłać avatara";
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          description = "Sesja wygasła, zaloguj się ponownie.";
        } else if (err.status === 413) {
          description = "Plik jest za duży.";
        } else if (err.status === 415) {
          description = "Nieobsługiwany format pliku.";
        } else if (err.status === 500) {
          description = err.message ? `Błąd serwera: ${err.message}` : "Wystąpił błąd serwera.";
        } else if (err.message) {
          description = err.message;
        }
      }
      pushToast({
        title: "Błąd",
        description,
        variant: "error",
      });
    } finally {
      setUploadingAvatar(false);
    }
  }, [avatarFile, avatarPreview, buildAvatarUrl, croppedAreaPixels, refresh, resetAvatarSelection]);

  const handleAvatarCancel = useCallback(() => {
    if (uploadingAvatar) return;
    resetAvatarSelection();
  }, [resetAvatarSelection, uploadingAvatar]);

  useEffect(() => {
    if (!avatarEditorOpen) return;
    const updateSize = () => {
      if (cropContainerRef.current) {
        setContainerSize(cropContainerRef.current.clientWidth);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [avatarEditorOpen]);

  const baseScale = useMemo(() => {
    if (!imageSize || !containerSize) return 1;
    return Math.max(containerSize / imageSize.width, containerSize / imageSize.height);
  }, [containerSize, imageSize]);

  const clampOffset = useCallback(
    (value: { x: number; y: number }, nextZoom = zoom) => {
      if (!imageSize || !containerSize) return value;
      const scaledWidth = imageSize.width * baseScale * nextZoom;
      const scaledHeight = imageSize.height * baseScale * nextZoom;
      const maxX = Math.max(0, (scaledWidth - containerSize) / 2);
      const maxY = Math.max(0, (scaledHeight - containerSize) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, value.x)),
        y: Math.min(maxY, Math.max(-maxY, value.y)),
      };
    },
    [baseScale, containerSize, imageSize, zoom],
  );

  useEffect(() => {
    setCropOffset((value) => clampOffset(value, zoom));
  }, [clampOffset, zoom]);

  useEffect(() => {
    if (!imageSize || !containerSize) return;
    const scaledWidth = imageSize.width * baseScale * zoom;
    const scaledHeight = imageSize.height * baseScale * zoom;
    const centerX = containerSize / 2 + cropOffset.x;
    const centerY = containerSize / 2 + cropOffset.y;
    const imageX = centerX - scaledWidth / 2;
    const imageY = centerY - scaledHeight / 2;

    const cropX = Math.max(0, ((0 - imageX) / scaledWidth) * imageSize.width);
    const cropY = Math.max(0, ((0 - imageY) / scaledHeight) * imageSize.height);
    const cropWidth = Math.min(imageSize.width - cropX, (containerSize / scaledWidth) * imageSize.width);
    const cropHeight = Math.min(imageSize.height - cropY, (containerSize / scaledHeight) * imageSize.height);

    setCroppedAreaPixels({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    });
  }, [baseScale, containerSize, cropOffset, imageSize, zoom]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!imageSize) return;
      event.preventDefault();
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: cropOffset.x,
        originY: cropOffset.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [cropOffset.x, cropOffset.y, imageSize],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current) return;
      const next = {
        x: dragStateRef.current.originX + (event.clientX - dragStateRef.current.startX),
        y: dragStateRef.current.originY + (event.clientY - dragStateRef.current.startY),
      };
      setCropOffset(clampOffset(next));
    },
    [clampOffset],
  );

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

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
      <div className="flex items-center gap-3 text-surface-600">
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
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80">
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
        <p className="text-2xl font-semibold text-surface-900">Profil</p>
        <p className="text-sm text-surface-500">Dane zalogowanego użytkownika</p>
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
              <p className="text-xl font-bold text-surface-900 mt-1">
                {formatName(profile)}
              </p>
            </div>
            <button
              className="btn-secondary text-sm"
              onClick={() => {
                setFirstName(profile.firstName ?? "");
                setLastName(profile.lastName ?? "");
                resetAvatarSelection();
                setEditProfileOpen(true);
              }}
            >
              Edytuj
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-surface-500">E-mail</p>
                <p className="font-semibold text-surface-900">{profile.email}</p>
              </div>
              <button
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                onClick={() => {
                  setNewEmail("");
                  setEmailPassword("");
                  setChangeEmailOpen(true);
                }}
              >
                Zmień
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-surface-500">Rola</p>
                <p className="font-semibold text-surface-900">{getRoleLabel(profile.role)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50">
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <div>
                <p className="text-xs font-medium text-surface-500">Organizacja</p>
                <p className="font-semibold text-surface-900">{profile.organisation.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="section-label">Bezpieczeństwo</p>
              <p className="text-base font-bold text-surface-900 mt-1">
                Ustawienia konta
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50">
              <div>
                <p className="font-medium text-surface-900">Hasło</p>
                <p className="text-sm text-surface-500">
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

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50">
              <div>
                <p className="font-medium text-surface-900">Sesja</p>
                <p className="text-sm text-surface-500">
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
          </div>
        </div>
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
          <label className="block space-y-1 text-sm font-medium text-surface-700">
            Imię
            <input
              type="text"
              className="input mt-1"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jan"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700">
            Nazwisko
            <input
              type="text"
              className="input mt-1"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Kowalski"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700">
            Zdjęcie profilowe
            <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl bg-surface-50 p-4">
              <Avatar
                name={`${firstName} ${lastName}`.trim() || profile.email}
                src={avatarPreview ?? profile.avatarUrl}
                size="md"
                className="h-16 w-16 text-xl"
              />
              <div className="space-y-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => handleAvatarSelect(event.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Zmień zdjęcie
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-sm"
                    onClick={() => setAvatarEditorOpen(true)}
                    disabled={!avatarPreview || uploadingAvatar}
                  >
                    {uploadingAvatar ? "Wysyłanie..." : "Edytuj"}
                  </button>
                </div>
                <p className="text-xs text-surface-500">
                  Dozwolone formaty: PNG, JPG, WEBP. Maksymalnie 5 MB.
                </p>
              </div>
            </div>
          </label>
        </div>
      </Modal>

      <Modal
        open={avatarEditorOpen}
        title="Edytuj zdjęcie"
        description="Dopasuj kadr i powiększenie"
        onClose={handleAvatarCancel}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={handleAvatarCancel} disabled={uploadingAvatar}>
              Anuluj
            </button>
            <button
              className="btn-primary"
              onClick={handleAvatarUpload}
              disabled={uploadingAvatar || !croppedAreaPixels}
            >
              {uploadingAvatar ? "Zapisywanie..." : "Zapisz"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div
            ref={cropContainerRef}
            className="relative h-72 w-full overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-950/70"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Podgląd avatara"
                onLoad={handleImageLoad}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${baseScale * zoom})`,
                  transformOrigin: "center",
                }}
                draggable={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-surface-400">
                Brak podglądu
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-surface-400">
              <span>Powiększenie</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-secondary h-10 w-10 px-0 text-lg"
                onClick={() => setZoom((value) => Math.max(1, Number((value - 0.2).toFixed(1))))}
                disabled={uploadingAvatar}
                aria-label="Zmniejsz"
              >
                −
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface-800 accent-brand-500"
                disabled={uploadingAvatar}
              />
              <button
                type="button"
                className="btn-secondary h-10 w-10 px-0 text-lg"
                onClick={() => setZoom((value) => Math.min(3, Number((value + 0.2).toFixed(1))))}
                disabled={uploadingAvatar}
                aria-label="Powiększ"
              >
                +
              </button>
            </div>
          </div>
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
          <label className="block space-y-1 text-sm font-medium text-surface-700">
            Aktualne hasło
            <input
              type="password"
              className="input mt-1"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700">
            Nowe hasło
            <input
              type="password"
              className="input mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 znaków"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700">
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
          <label className="block space-y-1 text-sm font-medium text-surface-700">
            Aktualne hasło
            <input
              type="password"
              className="input mt-1"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-surface-700">
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

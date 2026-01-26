"use client";

import { useRef, useState, useCallback } from "react";
import { Avatar } from "./Avatar";

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  label?: string;
  name?: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function AvatarUpload({
  currentUrl,
  onUpload,
  onDelete,
  size = "md",
  disabled = false,
  label = "Zdjęcie",
  name = "Avatar",
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const displayUrl = previewUrl || currentUrl;

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Niedozwolony typ pliku. Dozwolone: PNG, JPEG, WebP, GIF`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Plik jest za duży. Maksymalny rozmiar: ${MAX_SIZE_MB}MB`;
    }
    return null;
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input
      e.target.value = "";

      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
      setLoading(true);

      try {
        await onUpload(file);
        setPreviewUrl(null); // Clear preview after successful upload
      } catch (err) {
        setPreviewUrl(null);
        setError(err instanceof Error ? err.message : "Błąd przesyłania pliku");
      } finally {
        setLoading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [onUpload, validateFile],
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    setLoading(true);
    setError(null);

    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania zdjęcia");
    } finally {
      setLoading(false);
    }
  }, [onDelete]);

  const triggerFileInput = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
        {label}
      </p>

      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-surface-100 dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 flex items-center justify-center`}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Avatar name={name} size={size === "sm" ? "sm" : "md"} />
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || loading}
          />

          <button
            type="button"
            onClick={triggerFileInput}
            disabled={disabled || loading}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            {currentUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
          </button>

          {currentUrl && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled || loading}
              className="btn-ghost px-3 py-1.5 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              Usuń
            </button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-surface-500 dark:text-surface-400">
        Dozwolone formaty: PNG, JPEG, WebP, GIF. Maks. {MAX_SIZE_MB}MB.
      </p>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

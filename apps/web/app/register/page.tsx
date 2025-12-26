"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createApiClient } from "../../lib/api-client";
import { appConfig } from "../../lib/config";
import { useAuth, useToast } from "../providers";

const unauthenticatedApi = createApiClient(() => ({}));

type RegisterResponse = {
  message: string;
  organizationId?: string;
};

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { session, isReady } = useAuth();
  const { pushToast } = useToast();

  useEffect(() => {
    if (isReady && session) {
      router.replace("/app");
    }
  }, [isReady, router, session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { fullName, email, password, organizationName: orgName };
      const response = await unauthenticatedApi.post<RegisterResponse>("/auth/register", payload, { skipAuth: true });
      pushToast(response.message || "Konto utworzone. Sprawdź skrzynkę na maila.", "success");
      router.push("/login?returnUrl=/app");
    } catch (error) {
      console.error("Register failed", error);
      pushToast("Nie udało się utworzyć konta. Spróbuj ponownie lub użyj zaproszenia.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="app-card p-8 max-w-2xl w-full">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-tertiary)" }}>
              Public onboarding
            </p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Utwórz konto organizacji
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Formularz wykorzystuje endpoint <code>/auth/register</code> API V2 ({appConfig.apiUrl}).
              Po rejestracji możesz zaprosić zespół lub dokończyć onboarding jako admin.
            </p>
          </div>
          <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-tertiary)" }}>
              Po rejestracji
            </div>
            <ul className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li>• Wejdź na pulpit V2 i ustaw brand/rolę.</li>
              <li>• Wyślij zaproszenia lub wygeneruj token QR.</li>
              <li>• Zweryfikuj status API w zakładce Health.</li>
            </ul>
          </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Nazwa organizacji
            </label>
            <input
              className="input-primary mt-2"
              placeholder="np. KadryHR Demo"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Imię i nazwisko
            </label>
            <input
              className="input-primary mt-2"
              placeholder="np. Anna Nowak"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Służbowy email
            </label>
            <input
              type="email"
              className="input-primary mt-2"
              placeholder="anna@firma.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Hasło
            </label>
            <input
              type="password"
              className="input-primary mt-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col justify-end gap-3">
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Rejestruję..." : "Utwórz konto"}
            </button>
            <Link href="/login" className="text-sm font-semibold text-center hover:underline" style={{ color: "var(--text-secondary)" }}>
              Mam już konto
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, useToast } from "../providers";
import { appConfig } from "../../lib/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, session, isReady, isLoading } = useAuth();
  const { pushToast } = useToast();

  const returnUrl = searchParams.get("returnUrl") || "/";

  useEffect(() => {
    if (isReady && session) {
      router.replace(returnUrl);
    }
  }, [isReady, returnUrl, router, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password, orgId: orgId || undefined });
      router.replace(returnUrl);
    } catch (error) {
      console.error("Login failed", error);
      pushToast("Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="app-card p-8 max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Logowanie
          </h1>
          <p style={{ color: "var(--text-tertiary)" }}>
            Uwierzytelnianie przez API V2 ({appConfig.apiUrl}).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-primary"
              placeholder="twoj@email.pl"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label
              htmlFor="orgId"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Organizacja / orgId (opcjonalnie)
            </label>
            <input
              id="orgId"
              type="text"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="input-primary"
              placeholder="np. kadryhr-demo"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Jeśli pozostawisz puste, użyjemy domyślnej organizacji z tokena.
            </p>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nie masz konta?{" "}
            <a
              href="/register"
              className="font-medium hover:underline"
              style={{ color: "var(--theme-primary)" }}
            >
              Utwórz przez API V2
            </a>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border-primary)" }}>
          <Link
            href="/health"
            className="text-sm hover:underline block text-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            Sprawdź status API
          </Link>
        </div>
      </div>
    </div>
  );
}

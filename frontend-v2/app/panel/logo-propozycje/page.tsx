"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiApproveLogoProposal,
  apiCreateLogoProposal,
  apiGetLogoProposal,
  apiGetMe,
  apiListLogoProposals,
  apiRejectLogoProposal,
  apiSendLogoProposalFeedback,
  apiSubmitLogoProposal,
  apiUpdateLogoProposal,
  CreateLogoProposalPayload,
  LogoProposal,
  LogoProposalFeedback,
  LogoProposalStatus,
  LogoProposalVote,
  User,
} from "@/lib/api";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { buildLogoDataUrl, buildLogoSvg, LogoProposalConfig } from "@/lib/logo-proposals";
import { pushToast } from "@/lib/toast";

const STATUS_LABELS: Record<LogoProposalStatus, string> = {
  DRAFT: "Szkic",
  SUBMITTED: "Wysłane do oceny",
  APPROVED: "Zatwierdzone",
  REJECTED: "Odrzucone",
  ARCHIVED: "Archiwum",
};

const STATUS_STYLES: Record<LogoProposalStatus, string> = {
  DRAFT: "bg-surface-900/60 text-surface-300 border-surface-700/60",
  SUBMITTED: "bg-brand-900/40 text-brand-200 border-brand-700/50",
  APPROVED: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  REJECTED: "bg-rose-900/40 text-rose-200 border-rose-700/50",
  ARCHIVED: "bg-surface-900/40 text-surface-400 border-surface-700/50",
};

const DEFAULT_CONFIG: LogoProposalConfig = {
  brandName: "KadryHR",
  tagline: "Kadry i grafiki w rytmie",
  symbol: "monogram",
  layout: "inline",
  typography: "Sora",
  primaryColor: "#22c55e",
  secondaryColor: "#0b1411",
  accentColor: "#38bdf8",
};

const VOTE_LABELS: Record<LogoProposalVote, string> = {
  APPROVE: "Podoba mi się",
  NEUTRAL: "Neutralnie",
  REJECT: "Do poprawy",
};

export default function LogoProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasSession = useMemo(() => !!getAccessToken(), []);

  const [user, setUser] = useState<User | null>(null);
  const [proposals, setProposals] = useState<LogoProposal[]>([]);
  const [selected, setSelected] = useState<LogoProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Aurora Brand System");
  const [description, setDescription] = useState("Zrównoważony znak premium z naciskiem na stabilność.");
  const [config, setConfig] = useState<LogoProposalConfig>(DEFAULT_CONFIG);

  const [vote, setVote] = useState<LogoProposalVote>("APPROVE");
  const [comment, setComment] = useState("");
  const [applyToOrganisation, setApplyToOrganisation] = useState(true);
  const [rejectReason, setRejectReason] = useState("");

  const canManage = user ? ["OWNER", "ADMIN", "MANAGER"].includes(user.role) : false;

  const previewSvg = useMemo(() => buildLogoSvg(config), [config]);
  const previewUrl = useMemo(() => buildLogoDataUrl(previewSvg), [previewSvg]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [me, list] = await Promise.all([
        apiGetMe(),
        apiListLogoProposals(),
      ]);
      setUser(me);
      setProposals(list.data);
      const selectedId = searchParams.get("proposal");
      if (selectedId) {
        const detail = await apiGetLogoProposal(selectedId);
        setSelected(detail);
      } else if (list.data[0]) {
        setSelected(list.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Nie udało się wczytać propozycji logo");
      clearAuthTokens();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }
    void loadData();
  }, [hasSession, loadData, router]);

  const selectProposal = async (proposalId: string) => {
    setActionLoading(true);
    try {
      const detail = await apiGetLogoProposal(proposalId);
      setSelected(detail);
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się wczytać szczegółów", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const refreshList = async () => {
    const list = await apiListLogoProposals();
    setProposals(list.data);
  };

  const resetForm = () => {
    setTitle("Aurora Brand System");
    setDescription("Zrównoważony znak premium z naciskiem na stabilność.");
    setConfig(DEFAULT_CONFIG);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      pushToast({ title: "Błąd", description: "Podaj nazwę propozycji", variant: "error" });
      return;
    }

    setActionLoading(true);
    try {
      const payload: CreateLogoProposalPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        typography: config.typography,
        symbol: config.symbol,
        logoSvg: previewSvg,
        logoConfig: config,
      };
      const created = await apiCreateLogoProposal(payload);
      await refreshList();
      setSelected(created);
      pushToast({ title: "Gotowe", description: "Propozycja zapisana jako szkic", variant: "success" });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się zapisać szkicu", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const updated = await apiUpdateLogoProposal(selected.id, {
        title: title.trim() || selected.title,
        description: description.trim() || undefined,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        typography: config.typography,
        symbol: config.symbol,
        logoSvg: previewSvg,
        logoConfig: config,
      });
      await refreshList();
      setSelected(updated);
      pushToast({ title: "Zaktualizowano", description: "Szkic został uzupełniony", variant: "success" });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się zaktualizować szkicu", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const updated = await apiSubmitLogoProposal(selected.id);
      await refreshList();
      setSelected(updated);
      pushToast({ title: "Wysłano", description: "Propozycja trafiła do oceny", variant: "success" });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się wysłać propozycji", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const updated = await apiApproveLogoProposal(selected.id, { applyToOrganisation });
      await refreshList();
      setSelected(updated);
      pushToast({
        title: "Zatwierdzono",
        description: applyToOrganisation
          ? "Logo ustawione jako oficjalne"
          : "Propozycja zatwierdzona bez publikacji",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się zatwierdzić", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const updated = await apiRejectLogoProposal(selected.id, { reason: rejectReason.trim() || undefined });
      await refreshList();
      setSelected(updated);
      setRejectReason("");
      pushToast({ title: "Odrzucono", description: "Propozycja wróciła do poprawy", variant: "success" });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się odrzucić propozycji", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const response = await apiSendLogoProposalFeedback(selected.id, {
        vote,
        comment: comment.trim() || undefined,
      });
      const detail = await apiGetLogoProposal(selected.id);
      setSelected(detail);
      setComment("");
      pushToast({ title: "Dziękujemy", description: "Opinia została zapisana", variant: "success" });
      return response;
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się zapisać opinii", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!selected) return;
    if (selected.logoConfig) {
      setConfig(selected.logoConfig as LogoProposalConfig);
    }
    setTitle(selected.title);
    setDescription(selected.description ?? "");
  }, [selected]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/40 animate-pulse mx-auto" />
          <p className="text-sm text-surface-400">Ładowanie propozycji logo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-950/40 px-8 py-6 text-center">
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-surface-500">Branding organizacji</p>
          <h1 className="text-3xl font-semibold text-surface-50">Propozycje logo</h1>
          <p className="text-sm text-surface-400">
            Twórz nowoczesne logo, zbieraj opinie pracowników i zatwierdzaj finalny znak.
          </p>
        </div>
        <a
          href="/panel/audit?entityType=logo-proposal"
          className="rounded-full border border-surface-700/60 px-4 py-2 text-xs font-semibold text-surface-300 hover:bg-surface-800/60"
        >
          Zobacz audit
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-100">Lista propozycji</h2>
            <span className="text-xs text-surface-400">{proposals.length} wersji</span>
          </div>

          {proposals.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-surface-700/70 p-6 text-center text-sm text-surface-400">
              Brak propozycji. Stwórz pierwszą wersję logo.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {proposals.map((proposal) => (
                <button
                  key={proposal.id}
                  onClick={() => selectProposal(proposal.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    selected?.id === proposal.id
                      ? "border-brand-700/60 bg-brand-950/40"
                      : "border-surface-800/70 bg-surface-900/50 hover:border-brand-700/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={buildLogoDataUrl(proposal.logoSvg)}
                      alt={proposal.title}
                      className="h-12 w-20 rounded-xl bg-surface-900/60 object-contain"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-surface-100">{proposal.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_STYLES[proposal.status]}`}>
                          {STATUS_LABELS[proposal.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-surface-400 line-clamp-2">
                        {proposal.description ?? "Opis nie został uzupełniony."}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-100">Podgląd i decyzje</h2>
            {selected && (
              <span className={`rounded-full border px-3 py-1 text-xs ${STATUS_STYLES[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            )}
          </div>

          {!selected ? (
            <div className="mt-6 rounded-2xl border border-dashed border-surface-700/70 p-6 text-center text-sm text-surface-400">
              Wybierz propozycję, aby zobaczyć szczegóły.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-surface-800/70 bg-surface-900/70 p-5">
                <img src={buildLogoDataUrl(selected.logoSvg)} alt={selected.title} className="w-full max-h-40 object-contain" />
                <div className="mt-4">
                  <p className="text-sm font-semibold text-surface-100">{selected.title}</p>
                  <p className="text-xs text-surface-400">{selected.description ?? "Brak opisu"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-surface-400">
                  <span className="rounded-full border border-surface-700/70 px-2 py-1">Kolor główny: {selected.primaryColor}</span>
                  {selected.secondaryColor && (
                    <span className="rounded-full border border-surface-700/70 px-2 py-1">Tło: {selected.secondaryColor}</span>
                  )}
                  {selected.accentColor && (
                    <span className="rounded-full border border-surface-700/70 px-2 py-1">Akcent: {selected.accentColor}</span>
                  )}
                </div>
              </div>

              {canManage && selected.status === "DRAFT" && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleUpdate}
                    disabled={actionLoading}
                    className="rounded-full bg-surface-800/80 px-4 py-2 text-xs font-semibold text-surface-100 hover:bg-surface-700/80"
                  >
                    Zapisz zmiany
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading}
                    className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                  >
                    Wyślij do oceny
                  </button>
                </div>
              )}

              {canManage && selected.status === "SUBMITTED" && (
                <div className="rounded-2xl border border-surface-800/70 bg-surface-900/60 p-4 space-y-3">
                  <label className="flex items-center gap-2 text-xs text-surface-300">
                    <input
                      type="checkbox"
                      checked={applyToOrganisation}
                      onChange={(event) => setApplyToOrganisation(event.target.checked)}
                      className="h-4 w-4 rounded border-surface-600 bg-surface-900 text-brand-500"
                    />
                    Ustaw jako logo organizacji po zatwierdzeniu
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Zatwierdź
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Odrzuć
                    </button>
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Powód odrzucenia (opcjonalnie)"
                    className="w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-xs text-surface-200"
                    rows={3}
                  />
                </div>
              )}

              {!canManage && selected && ["SUBMITTED", "APPROVED"].includes(selected.status) && (
                <div className="rounded-2xl border border-surface-800/70 bg-surface-900/60 p-4 space-y-3">
                  <p className="text-xs text-surface-400">Twoja opinia wpływa na finalny wybór logo.</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(VOTE_LABELS) as LogoProposalVote[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => setVote(option)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          vote === option
                            ? "border-brand-600 bg-brand-600/20 text-brand-200"
                            : "border-surface-700/70 text-surface-300 hover:border-brand-600/60"
                        }`}
                      >
                        {VOTE_LABELS[option]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Dodatkowa opinia (opcjonalnie)"
                    className="w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-xs text-surface-200"
                    rows={3}
                  />
                  <button
                    onClick={handleFeedback}
                    disabled={actionLoading}
                    className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                  >
                    Zapisz opinię
                  </button>
                </div>
              )}

              {selected.feedbacks && selected.feedbacks.length > 0 && (
                <div className="rounded-2xl border border-surface-800/70 bg-surface-950/60 p-4">
                  <p className="text-xs font-semibold text-surface-300">Opinie zespołu</p>
                  <div className="mt-3 space-y-2">
                    {selected.feedbacks.map((feedback: LogoProposalFeedback) => (
                      <div key={feedback.id} className="rounded-2xl border border-surface-800/70 bg-surface-900/60 p-3 text-xs text-surface-300">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-surface-200">
                            {feedback.user?.firstName ?? feedback.user?.email ?? "Anonim"}
                          </span>
                          <span className="text-[11px] text-brand-200">{VOTE_LABELS[feedback.vote]}</span>
                        </div>
                        {feedback.comment && <p className="mt-2 text-surface-400">{feedback.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {canManage && (
        <section className="rounded-3xl border border-surface-800/70 bg-surface-950/60 p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-100">Generator propozycji</h2>
              <div className="space-y-3">
                <label className="block text-xs text-surface-400">
                  Nazwa propozycji
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                  />
                </label>
                <label className="block text-xs text-surface-400">
                  Opis biznesowy
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                    rows={3}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-surface-400">
                  Nazwa brandu
                  <input
                    value={config.brandName}
                    onChange={(event) => setConfig((prev) => ({ ...prev, brandName: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                  />
                </label>
                <label className="block text-xs text-surface-400">
                  Tagline
                  <input
                    value={config.tagline}
                    onChange={(event) => setConfig((prev) => ({ ...prev, tagline: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                  />
                </label>
                <label className="block text-xs text-surface-400">
                  Symbol
                  <select
                    value={config.symbol}
                    onChange={(event) => setConfig((prev) => ({ ...prev, symbol: event.target.value as LogoProposalConfig["symbol"] }))}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                  >
                    <option value="monogram">Monogram</option>
                    <option value="pulse">Pulse</option>
                    <option value="hex">Hex</option>
                    <option value="shield">Shield</option>
                  </select>
                </label>
                <label className="block text-xs text-surface-400">
                  Układ
                  <select
                    value={config.layout}
                    onChange={(event) => setConfig((prev) => ({ ...prev, layout: event.target.value as LogoProposalConfig["layout"] }))}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                  >
                    <option value="inline">Poziomy</option>
                    <option value="stacked">Pionowy</option>
                  </select>
                </label>
                <label className="block text-xs text-surface-400">
                  Typografia
                  <input
                    value={config.typography}
                    onChange={(event) => setConfig((prev) => ({ ...prev, typography: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-4 py-3 text-sm text-surface-200"
                  />
                </label>
                <label className="block text-xs text-surface-400">
                  Kolor główny
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(event) => setConfig((prev) => ({ ...prev, primaryColor: event.target.value }))}
                    className="mt-1 h-12 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-2"
                  />
                </label>
                <label className="block text-xs text-surface-400">
                  Kolor tła
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(event) => setConfig((prev) => ({ ...prev, secondaryColor: event.target.value }))}
                    className="mt-1 h-12 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-2"
                  />
                </label>
                <label className="block text-xs text-surface-400">
                  Kolor akcentu
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(event) => setConfig((prev) => ({ ...prev, accentColor: event.target.value }))}
                    className="mt-1 h-12 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 px-2"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreate}
                  disabled={actionLoading}
                  className="rounded-full bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                >
                  Zapisz jako nowy szkic
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-full border border-surface-700/70 px-5 py-2 text-xs font-semibold text-surface-300 hover:bg-surface-900/60"
                >
                  Resetuj
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-surface-800/70 bg-surface-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Podgląd trendów</p>
              <img
                src={previewUrl}
                alt="Podgląd logo"
                className="mt-4 w-full rounded-2xl border border-surface-800/60 bg-surface-950/70 p-4"
              />
              <div className="mt-4 grid gap-3 text-xs text-surface-400">
                <div className="rounded-2xl border border-surface-800/70 bg-surface-950/70 p-3">
                  <p className="text-surface-200 font-semibold">Zgodne z trendami 2024/25</p>
                  <p className="mt-1">Minimalistyczne kształty, kontrastowy gradient i czytelna typografia.</p>
                </div>
                <div className="rounded-2xl border border-surface-800/70 bg-surface-950/70 p-3">
                  <p className="text-surface-200 font-semibold">Gotowe do wdrożenia</p>
                  <p className="mt-1">Logo skalowalne do aplikacji, materiałów HR i komunikacji employer branding.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

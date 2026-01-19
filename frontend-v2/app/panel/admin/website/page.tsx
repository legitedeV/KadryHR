"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  apiCreateWebsitePage,
  apiGetWebsiteSettings,
  apiListWebsitePages,
  apiPublishWebsitePage,
  apiUpdateWebsiteSettings,
  WebsitePageSummary,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";

const emptySettingsState = {
  contactEmails: "",
  socialLinks: "",
  footerLinks: "",
  cookieBannerText: "",
  cookiePolicyUrl: "",
  privacyPolicyUrl: "",
  termsOfServiceUrl: "",
};

export default function AdminWebsitePage() {
  const [pages, setPages] = useState<WebsitePageSummary[]>([]);
  const [settingsDraft, setSettingsDraft] = useState(emptySettingsState);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [newPage, setNewPage] = useState({
    slug: "",
    seoTitle: "",
    seoDescription: "",
    seoImageUrl: "",
    isPublished: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesData, settingsData] = await Promise.all([
        apiListWebsitePages(),
        apiGetWebsiteSettings(),
      ]);
      setPages(pagesData);
      setSettingsDraft({
        contactEmails: settingsData.contactEmails.join(", "),
        socialLinks: settingsData.socialLinks
          ? JSON.stringify(settingsData.socialLinks, null, 2)
          : "",
        footerLinks: settingsData.footerLinks
          ? JSON.stringify(settingsData.footerLinks, null, 2)
          : "",
        cookieBannerText: settingsData.cookieBannerText ?? "",
        cookiePolicyUrl: settingsData.cookiePolicyUrl ?? "",
        privacyPolicyUrl: settingsData.privacyPolicyUrl ?? "",
        termsOfServiceUrl: settingsData.termsOfServiceUrl ?? "",
      });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się pobrać danych o stronach marketingowych.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePage = async () => {
    if (!newPage.slug) {
      pushToast({ title: "Brak slug", description: "Uzupełnij slug strony.", variant: "error" });
      return;
    }

    setCreatingPage(true);
    try {
      await apiCreateWebsitePage({
        slug: newPage.slug,
        seoTitle: newPage.seoTitle || undefined,
        seoDescription: newPage.seoDescription || undefined,
        seoImageUrl: newPage.seoImageUrl || undefined,
        isPublished: newPage.isPublished,
      });
      pushToast({ title: "Strona dodana", description: "Nowa strona została utworzona." });
      setNewPage({
        slug: "",
        seoTitle: "",
        seoDescription: "",
        seoImageUrl: "",
        isPublished: false,
      });
      await loadData();
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się utworzyć strony.",
        variant: "error",
      });
    } finally {
      setCreatingPage(false);
    }
  };

  const handleTogglePublish = async (page: WebsitePageSummary) => {
    try {
      const updated = await apiPublishWebsitePage(page.slug, !page.isPublished);
      setPages((prev) =>
        prev.map((item) => (item.slug === updated.slug ? { ...item, ...updated } : item)),
      );
      pushToast({
        title: updated.isPublished ? "Opublikowano" : "Cofnięto publikację",
        description: `Strona ${updated.slug} została zaktualizowana.`,
      });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zaktualizować publikacji.",
        variant: "error",
      });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const contactEmails = settingsDraft.contactEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      const parseJson = (value: string) => {
        if (!value.trim()) return null;
        return JSON.parse(value);
      };

      const payload = {
        contactEmails,
        socialLinks: parseJson(settingsDraft.socialLinks),
        footerLinks: parseJson(settingsDraft.footerLinks),
        cookieBannerText: settingsDraft.cookieBannerText || null,
        cookiePolicyUrl: settingsDraft.cookiePolicyUrl || null,
        privacyPolicyUrl: settingsDraft.privacyPolicyUrl || null,
        termsOfServiceUrl: settingsDraft.termsOfServiceUrl || null,
      };

      await apiUpdateWebsiteSettings(payload);
      pushToast({ title: "Zapisano", description: "Ustawienia zostały zaktualizowane." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać ustawień. Sprawdź format JSON.",
        variant: "error",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-surface-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-sm">Ładowanie treści strony...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <Link href="/panel/admin" className="hover:text-surface-200">
            Panel admina
          </Link>
          <span>/</span>
          <span className="text-surface-200">Treści strony</span>
        </div>
        <h1 className="text-2xl font-semibold text-surface-50 mt-2">Zarządzanie treścią strony</h1>
        <p className="text-sm text-surface-400 mt-2">
          Edytuj landing page, cennik oraz ustawienia globalne strony kadryhr.pl.
        </p>
      </div>

      <div className="panel-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-100">Nowa strona marketingowa</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-surface-300">
            Slug
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              placeholder="np. home, pricing, faq"
              value={newPage.slug}
              onChange={(event) => setNewPage((prev) => ({ ...prev, slug: event.target.value }))}
            />
          </label>
          <label className="text-sm text-surface-300">
            SEO title
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={newPage.seoTitle}
              onChange={(event) => setNewPage((prev) => ({ ...prev, seoTitle: event.target.value }))}
            />
          </label>
          <label className="text-sm text-surface-300 md:col-span-2">
            SEO description
            <textarea
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[90px]"
              value={newPage.seoDescription}
              onChange={(event) => setNewPage((prev) => ({ ...prev, seoDescription: event.target.value }))}
            />
          </label>
          <label className="text-sm text-surface-300">
            SEO image URL
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={newPage.seoImageUrl}
              onChange={(event) => setNewPage((prev) => ({ ...prev, seoImageUrl: event.target.value }))}
            />
          </label>
          <label className="text-sm text-surface-300 flex items-center gap-2 mt-7">
            <input
              type="checkbox"
              checked={newPage.isPublished}
              onChange={(event) => setNewPage((prev) => ({ ...prev, isPublished: event.target.checked }))}
              className="h-4 w-4 rounded border-surface-700 bg-surface-900 text-brand-500"
            />
            Opublikowana od razu
          </label>
        </div>
        <button
          className="btn-primary px-4 py-2 text-sm"
          onClick={handleCreatePage}
          disabled={creatingPage}
        >
          {creatingPage ? "Tworzenie..." : "Dodaj stronę"}
        </button>
      </div>

      <div className="panel-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-100">Strony marketingowe</h2>
        {pages.length === 0 ? (
          <p className="text-sm text-surface-400">Brak stron do wyświetlenia.</p>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-surface-100">{page.slug}</p>
                  <p className="text-xs text-surface-500">
                    {page.isPublished ? "Opublikowana" : "Wersja robocza"} · {page._count?.sections ?? 0} sekcji
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(page)}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    {page.isPublished ? "Cofnij publikację" : "Opublikuj"}
                  </button>
                  <Link
                    href={`/console/website/pages/${page.slug}`}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    Edytuj
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-100">Ustawienia globalne</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-surface-300 md:col-span-2">
            Kontaktowe e-maile (oddzielone przecinkami)
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={settingsDraft.contactEmails}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, contactEmails: event.target.value }))
              }
            />
          </label>
          <label className="text-sm text-surface-300">
            Social links (JSON)
            <textarea
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[120px]"
              value={settingsDraft.socialLinks}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, socialLinks: event.target.value }))
              }
            />
          </label>
          <label className="text-sm text-surface-300">
            Linki w stopce (JSON)
            <textarea
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[120px]"
              value={settingsDraft.footerLinks}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, footerLinks: event.target.value }))
              }
            />
          </label>
          <label className="text-sm text-surface-300 md:col-span-2">
            Tekst bannera cookies
            <textarea
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[100px]"
              value={settingsDraft.cookieBannerText}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, cookieBannerText: event.target.value }))
              }
            />
          </label>
          <label className="text-sm text-surface-300">
            URL polityki cookies
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={settingsDraft.cookiePolicyUrl}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, cookiePolicyUrl: event.target.value }))
              }
            />
          </label>
          <label className="text-sm text-surface-300">
            URL polityki prywatności
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={settingsDraft.privacyPolicyUrl}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, privacyPolicyUrl: event.target.value }))
              }
            />
          </label>
          <label className="text-sm text-surface-300">
            URL regulaminu
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={settingsDraft.termsOfServiceUrl}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, termsOfServiceUrl: event.target.value }))
              }
            />
          </label>
        </div>
        <button
          className="btn-primary px-4 py-2 text-sm"
          onClick={handleSaveSettings}
          disabled={savingSettings}
        >
          {savingSettings ? "Zapisywanie..." : "Zapisz ustawienia"}
        </button>
      </div>
    </div>
  );
}

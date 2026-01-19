"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  apiCreateWebsiteBlock,
  apiCreateWebsiteSection,
  apiDeleteWebsiteBlock,
  apiDeleteWebsiteSection,
  apiGetWebsitePage,
  apiPublishWebsitePage,
  apiUpdateWebsiteBlock,
  apiUpdateWebsitePage,
  apiUpdateWebsiteSection,
  WebsiteBlock,
  WebsitePageDetail,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";

type BlockDraft = {
  type: string;
  title: string;
  body: string;
  mediaUrl: string;
  extra: Record<string, unknown>;
  order?: number;
};

type SectionDraft = {
  key?: string;
  title?: string;
  subtitle?: string;
  order?: number;
};

const defaultBlockDraft: BlockDraft = {
  type: "feature",
  title: "",
  body: "",
  mediaUrl: "",
  extra: {},
};

export default function AdminWebsitePageEditor() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [page, setPage] = useState<WebsitePageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [newSection, setNewSection] = useState({ key: "", title: "", subtitle: "" });
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, SectionDraft>>({});
  const [blockDrafts, setBlockDrafts] = useState<Record<string, BlockDraft>>({});

  const sortedSections = useMemo(() => {
    if (!page) return [];
    return [...page.sections].sort((a, b) => a.order - b.order);
  }, [page]);

  const loadPage = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await apiGetWebsitePage(slug);
      setPage(data);
      const sectionState: Record<string, SectionDraft> = {};
      data.sections.forEach((section) => {
        sectionState[section.id] = {
          key: section.key,
          title: section.title ?? "",
          subtitle: section.subtitle ?? "",
          order: section.order,
        };
      });
      setSectionDrafts(sectionState);
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się pobrać strony.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleSavePage = async () => {
    if (!page || !slug) return;
    setSavingPage(true);
    try {
      const updated = await apiUpdateWebsitePage(slug, {
        seoTitle: page.seoTitle ?? "",
        seoDescription: page.seoDescription ?? "",
        seoImageUrl: page.seoImageUrl ?? "",
        isPublished: page.isPublished,
        slug: page.slug,
      });
      setPage(updated);
      pushToast({ title: "Zapisano", description: "Metadane strony zapisane." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać metadanych.",
        variant: "error",
      });
    } finally {
      setSavingPage(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!page) return;
    try {
      const updated = await apiPublishWebsitePage(page.slug, !page.isPublished);
      setPage(updated);
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu publikacji.",
        variant: "error",
      });
    }
  };

  const handleCreateSection = async () => {
    if (!page || !newSection.key) return;
    try {
      const created = await apiCreateWebsiteSection({
        pageId: page.id,
        key: newSection.key,
        title: newSection.title || undefined,
        subtitle: newSection.subtitle || undefined,
        order: page.sections.length,
      });
      setPage((prev) =>
        prev ? { ...prev, sections: [...prev.sections, { ...created, blocks: [] }] } : prev,
      );
      setNewSection({ key: "", title: "", subtitle: "" });
      pushToast({ title: "Dodano sekcję", description: "Sekcja została utworzona." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się dodać sekcji.",
        variant: "error",
      });
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!sectionDrafts[sectionId]) return;
    try {
      const updated = await apiUpdateWebsiteSection(sectionId, sectionDrafts[sectionId]);
      setPage((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((section) =>
                section.id === updated.id ? { ...section, ...updated } : section,
              ),
            }
          : prev,
      );
      pushToast({ title: "Zapisano sekcję", description: "Sekcja została zaktualizowana." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać sekcji.",
        variant: "error",
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Usunąć sekcję wraz z blokami?")) return;
    try {
      await apiDeleteWebsiteSection(sectionId);
      setPage((prev) =>
        prev ? { ...prev, sections: prev.sections.filter((section) => section.id !== sectionId) } : prev,
      );
      pushToast({ title: "Usunięto sekcję", description: "Sekcja została usunięta." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się usunąć sekcji.",
        variant: "error",
      });
    }
  };

  const handleSectionOrderChange = async (sectionId: string, direction: "up" | "down") => {
    if (!page) return;
    const sorted = [...page.sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];
    try {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        apiUpdateWebsiteSection(current.id, { order: target.order }),
        apiUpdateWebsiteSection(target.id, { order: current.order }),
      ]);
      setPage((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((section) => {
                if (section.id === updatedCurrent.id) return { ...section, ...updatedCurrent };
                if (section.id === updatedTarget.id) return { ...section, ...updatedTarget };
                return section;
              }),
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić kolejności sekcji.",
        variant: "error",
      });
    }
  };

  const handleBlockDraftChange = (sectionId: string, draft: BlockDraft) => {
    setBlockDrafts((prev) => ({ ...prev, [sectionId]: draft }));
  };

  const handleCreateBlock = async (sectionId: string) => {
    const draft = blockDrafts[sectionId] ?? defaultBlockDraft;
    if (!draft.type) return;
    try {
      const created = await apiCreateWebsiteBlock({
        sectionId,
        type: draft.type,
        title: draft.title || undefined,
        body: draft.body || undefined,
        mediaUrl: draft.mediaUrl || undefined,
        extra: Object.keys(draft.extra || {}).length ? draft.extra : undefined,
        order: draft.order,
      });
      setPage((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((section) =>
                section.id === sectionId
                  ? { ...section, blocks: [...section.blocks, created] }
                  : section,
              ),
            }
          : prev,
      );
      setBlockDrafts((prev) => ({ ...prev, [sectionId]: { ...defaultBlockDraft } }));
      pushToast({ title: "Dodano blok", description: "Blok został utworzony." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się dodać bloku.",
        variant: "error",
      });
    }
  };

  const handleSaveBlock = async (block: WebsiteBlock, payload: Partial<WebsiteBlock>) => {
    try {
      const updated = await apiUpdateWebsiteBlock(block.id, {
        type: payload.type ?? block.type,
        title: payload.title ?? block.title ?? "",
        body: payload.body ?? block.body ?? "",
        mediaUrl: payload.mediaUrl ?? block.mediaUrl ?? "",
        extra: payload.extra ?? (block.extra ?? {}),
        order: payload.order ?? block.order,
      });
      setPage((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((section) => ({
                ...section,
                blocks: section.blocks.map((item) =>
                  item.id === updated.id ? { ...item, ...updated } : item,
                ),
              })),
            }
          : prev,
      );
      pushToast({ title: "Zapisano blok", description: "Blok został zaktualizowany." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać bloku.",
        variant: "error",
      });
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Usunąć blok?")) return;
    try {
      await apiDeleteWebsiteBlock(blockId);
      setPage((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((section) => ({
                ...section,
                blocks: section.blocks.filter((block) => block.id !== blockId),
              })),
            }
          : prev,
      );
      pushToast({ title: "Usunięto blok", description: "Blok został usunięty." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się usunąć bloku.",
        variant: "error",
      });
    }
  };

  const handleBlockOrderChange = async (
    sectionId: string,
    blockId: string,
    direction: "up" | "down",
  ) => {
    if (!page) return;
    const section = page.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const sorted = [...section.blocks].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((block) => block.id === blockId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const current = sorted[index];
    const target = sorted[targetIndex];
    try {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        apiUpdateWebsiteBlock(current.id, { order: target.order }),
        apiUpdateWebsiteBlock(target.id, { order: current.order }),
      ]);
      setPage((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((item) =>
                item.id === sectionId
                  ? {
                      ...item,
                      blocks: item.blocks.map((block) => {
                        if (block.id === updatedCurrent.id) return { ...block, ...updatedCurrent };
                        if (block.id === updatedTarget.id) return { ...block, ...updatedTarget };
                        return block;
                      }),
                    }
                  : item,
              ),
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zmienić kolejności bloku.",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-surface-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-sm">Ładowanie strony...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="panel-card p-6">
        <p className="text-sm text-surface-300">Nie znaleziono strony.</p>
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
          <Link href="/panel/admin/website" className="hover:text-surface-200">
            Treści strony
          </Link>
          <span>/</span>
          <span className="text-surface-200">{page.slug}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-surface-50">Edytuj stronę: {page.slug}</h1>
            <p className="text-sm text-surface-400 mt-1">
              Zarządzaj sekcjami, blokami oraz SEO.
            </p>
          </div>
          <button
            className="btn-secondary px-4 py-2 text-sm"
            onClick={handleTogglePublish}
          >
            {page.isPublished ? "Cofnij publikację" : "Opublikuj"}
          </button>
        </div>
      </div>

      <div className="panel-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-100">SEO i metadane</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-surface-300">
            Slug
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={page.slug}
              onChange={(event) => setPage((prev) => (prev ? { ...prev, slug: event.target.value } : prev))}
            />
          </label>
          <label className="text-sm text-surface-300">
            SEO title
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={page.seoTitle ?? ""}
              onChange={(event) =>
                setPage((prev) => (prev ? { ...prev, seoTitle: event.target.value } : prev))
              }
            />
          </label>
          <label className="text-sm text-surface-300 md:col-span-2">
            SEO description
            <textarea
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[90px]"
              value={page.seoDescription ?? ""}
              onChange={(event) =>
                setPage((prev) =>
                  prev ? { ...prev, seoDescription: event.target.value } : prev,
                )
              }
            />
          </label>
          <label className="text-sm text-surface-300">
            SEO image URL
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              value={page.seoImageUrl ?? ""}
              onChange={(event) =>
                setPage((prev) =>
                  prev ? { ...prev, seoImageUrl: event.target.value } : prev,
                )
              }
            />
          </label>
          <label className="text-sm text-surface-300 flex items-center gap-2 mt-7">
            <input
              type="checkbox"
              checked={page.isPublished}
              onChange={(event) =>
                setPage((prev) => (prev ? { ...prev, isPublished: event.target.checked } : prev))
              }
              className="h-4 w-4 rounded border-surface-700 bg-surface-900 text-brand-500"
            />
            Strona opublikowana
          </label>
        </div>
        <button className="btn-primary px-4 py-2 text-sm" onClick={handleSavePage} disabled={savingPage}>
          {savingPage ? "Zapisywanie..." : "Zapisz SEO"}
        </button>
      </div>

      <div className="panel-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-100">Dodaj sekcję</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
            placeholder="Klucz (np. hero, pricing_plans)"
            value={newSection.key}
            onChange={(event) => setNewSection((prev) => ({ ...prev, key: event.target.value }))}
          />
          <input
            className="rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
            placeholder="Tytuł sekcji"
            value={newSection.title}
            onChange={(event) => setNewSection((prev) => ({ ...prev, title: event.target.value }))}
          />
          <input
            className="rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
            placeholder="Podtytuł sekcji"
            value={newSection.subtitle}
            onChange={(event) => setNewSection((prev) => ({ ...prev, subtitle: event.target.value }))}
          />
        </div>
        <button className="btn-primary px-4 py-2 text-sm" onClick={handleCreateSection}>
          Dodaj sekcję
        </button>
      </div>

      {sortedSections.map((section) => {
        const draft = sectionDrafts[section.id] ?? {};
        const sortedBlocks = [...section.blocks].sort((a, b) => a.order - b.order);
        const blockDraft = blockDrafts[section.id] ?? defaultBlockDraft;
        return (
          <div key={section.id} className="panel-card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-surface-100">
                  Sekcja: {section.key}
                </h3>
                <p className="text-xs text-surface-500">ID: {section.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => handleSectionOrderChange(section.id, "up")}
                >
                  ↑
                </button>
                <button
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => handleSectionOrderChange(section.id, "down")}
                >
                  ↓
                </button>
                <button
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => handleDeleteSection(section.id)}
                >
                  Usuń
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-xs text-surface-400">
                Klucz
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={draft.key ?? ""}
                  onChange={(event) =>
                    setSectionDrafts((prev) => ({
                      ...prev,
                      [section.id]: { ...prev[section.id], key: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-surface-400">
                Tytuł
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={draft.title ?? ""}
                  onChange={(event) =>
                    setSectionDrafts((prev) => ({
                      ...prev,
                      [section.id]: { ...prev[section.id], title: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-surface-400">
                Podtytuł
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={draft.subtitle ?? ""}
                  onChange={(event) =>
                    setSectionDrafts((prev) => ({
                      ...prev,
                      [section.id]: { ...prev[section.id], subtitle: event.target.value },
                    }))
                  }
                />
              </label>
            </div>
            <button
              className="btn-primary px-4 py-2 text-xs"
              onClick={() => handleSaveSection(section.id)}
            >
              Zapisz sekcję
            </button>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-200">Bloki</h4>
              {sortedBlocks.length === 0 ? (
                <p className="text-xs text-surface-500">Brak bloków w tej sekcji.</p>
              ) : (
                sortedBlocks.map((block) => (
                  <div key={block.id} className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-surface-400">Typ: {block.type}</p>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => handleBlockOrderChange(section.id, block.id, "up")}
                        >
                          ↑
                        </button>
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => handleBlockOrderChange(section.id, block.id, "down")}
                        >
                          ↓
                        </button>
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => handleDeleteBlock(block.id)}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs text-surface-400">
                        Typ
                        <select
                          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                          value={block.type}
                          onChange={(event) =>
                            handleSaveBlock(block, { type: event.target.value })
                          }
                        >
                          {[
                            "feature",
                            "highlight",
                            "stat",
                            "metric",
                            "plan",
                            "faq_item",
                            "testimonial",
                            "primary_cta",
                            "secondary_cta",
                            "badge",
                          ].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-surface-400">
                        Tytuł
                        <input
                          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                          defaultValue={block.title ?? ""}
                          onBlur={(event) => handleSaveBlock(block, { title: event.target.value })}
                        />
                      </label>
                      <label className="text-xs text-surface-400 md:col-span-2">
                        Treść
                        <textarea
                          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[80px]"
                          defaultValue={block.body ?? ""}
                          onBlur={(event) => handleSaveBlock(block, { body: event.target.value })}
                        />
                      </label>
                      <label className="text-xs text-surface-400">
                        Media URL
                        <input
                          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                          defaultValue={block.mediaUrl ?? ""}
                          onBlur={(event) => handleSaveBlock(block, { mediaUrl: event.target.value })}
                        />
                      </label>
                      <label className="text-xs text-surface-400">
                        Kolejność
                        <input
                          type="number"
                          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                          defaultValue={block.order}
                          onBlur={(event) =>
                            handleSaveBlock(block, { order: Number(event.target.value) })
                          }
                        />
                      </label>
                    </div>
                    <BlockExtraEditor block={block} onSave={(extra) => handleSaveBlock(block, { extra })} />
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-surface-700/60 bg-surface-900/40 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-surface-200">Dodaj blok</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-surface-400">
                  Typ
                  <select
                    className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                    value={blockDraft.type}
                    onChange={(event) =>
                      handleBlockDraftChange(section.id, { ...blockDraft, type: event.target.value })
                    }
                  >
                    {[
                      "feature",
                      "highlight",
                      "stat",
                      "metric",
                      "plan",
                      "faq_item",
                      "testimonial",
                      "primary_cta",
                      "secondary_cta",
                      "badge",
                    ].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-surface-400">
                  Tytuł
                  <input
                    className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                    value={blockDraft.title}
                    onChange={(event) =>
                      handleBlockDraftChange(section.id, { ...blockDraft, title: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-surface-400 md:col-span-2">
                  Treść
                  <textarea
                    className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[80px]"
                    value={blockDraft.body}
                    onChange={(event) =>
                      handleBlockDraftChange(section.id, { ...blockDraft, body: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-surface-400">
                  Media URL
                  <input
                    className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                    value={blockDraft.mediaUrl}
                    onChange={(event) =>
                      handleBlockDraftChange(section.id, { ...blockDraft, mediaUrl: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-surface-400">
                  Kolejność
                  <input
                    type="number"
                    className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                    value={blockDraft.order ?? ""}
                    onChange={(event) =>
                      handleBlockDraftChange(section.id, {
                        ...blockDraft,
                        order: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <BlockDraftExtraEditor
                draft={blockDraft}
                onChange={(extra) => handleBlockDraftChange(section.id, { ...blockDraft, extra })}
              />
              <button className="btn-primary px-4 py-2 text-xs" onClick={() => handleCreateBlock(section.id)}>
                Dodaj blok
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlockExtraEditor({ block, onSave }: { block: WebsiteBlock; onSave: (extra: Record<string, unknown>) => void }) {
  const [extraDraft, setExtraDraft] = useState<Record<string, unknown>>(() => (block.extra ?? {}) as Record<string, unknown>);
  const [jsonValue, setJsonValue] = useState(() =>
    Object.keys(extraDraft).length ? JSON.stringify(extraDraft, null, 2) : "",
  );

  useEffect(() => {
    const nextExtra = (block.extra ?? {}) as Record<string, unknown>;
    setExtraDraft(nextExtra);
    setJsonValue(Object.keys(nextExtra).length ? JSON.stringify(nextExtra, null, 2) : "");
  }, [block.extra]);

  const handleSaveJson = () => {
    try {
      const parsed = jsonValue.trim() ? JSON.parse(jsonValue) : {};
      onSave(parsed);
      pushToast({ title: "Zapisano extra", description: "Dodatkowe pola zostały zapisane." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nieprawidłowy JSON w polu extra.",
        variant: "error",
      });
    }
  };

  const isPlan = block.type === "plan";
  const isMetric = block.type === "metric" || block.type === "stat";
  const isCta = block.type === "primary_cta" || block.type === "secondary_cta";
  const isTestimonial = block.type === "testimonial";

  return (
    <div className="space-y-3">
      {(isPlan || isMetric || isCta || isTestimonial) && (
        <div className="grid gap-3 md:grid-cols-2">
          {isPlan && (
            <>
              <label className="text-xs text-surface-400">
                Cena (extra.price)
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={(extraDraft.price as string) ?? ""}
                  onChange={(event) =>
                    setExtraDraft((prev) => ({ ...prev, price: event.target.value }))
                  }
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
              <label className="text-xs text-surface-400">
                Okres (extra.cadence)
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={(extraDraft.cadence as string) ?? ""}
                  onChange={(event) =>
                    setExtraDraft((prev) => ({ ...prev, cadence: event.target.value }))
                  }
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
              <label className="text-xs text-surface-400">
                Badge (extra.badge)
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={(extraDraft.badge as string) ?? ""}
                  onChange={(event) =>
                    setExtraDraft((prev) => ({ ...prev, badge: event.target.value }))
                  }
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
              <label className="text-xs text-surface-400">
                Wyróżnij plan
                <input
                  type="checkbox"
                  className="ml-2"
                  checked={extraDraft.highlighted === true}
                  onChange={(event) => {
                    const next = { ...extraDraft, highlighted: event.target.checked };
                    setExtraDraft(next);
                    onSave(next);
                  }}
                />
              </label>
              <label className="text-xs text-surface-400 md:col-span-2">
                Funkcje (extra.features, każda linia to osobna pozycja)
                <textarea
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[80px]"
                  value={Array.isArray(extraDraft.features) ? extraDraft.features.join("\n") : ""}
                  onChange={(event) => {
                    const features = event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean);
                    const next = { ...extraDraft, features };
                    setExtraDraft(next);
                  }}
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
            </>
          )}
          {isMetric && (
            <>
              <label className="text-xs text-surface-400">
                Wartość (extra.value)
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={extraDraft.value?.toString() ?? ""}
                  onChange={(event) =>
                    setExtraDraft((prev) => ({ ...prev, value: Number(event.target.value) }))
                  }
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
              <label className="text-xs text-surface-400">
                Prefix (extra.prefix)
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={(extraDraft.prefix as string) ?? ""}
                  onChange={(event) =>
                    setExtraDraft((prev) => ({ ...prev, prefix: event.target.value }))
                  }
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
              <label className="text-xs text-surface-400">
                Suffix (extra.suffix)
                <input
                  className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                  value={(extraDraft.suffix as string) ?? ""}
                  onChange={(event) =>
                    setExtraDraft((prev) => ({ ...prev, suffix: event.target.value }))
                  }
                  onBlur={() => onSave(extraDraft)}
                />
              </label>
            </>
          )}
          {isCta && (
            <label className="text-xs text-surface-400 md:col-span-2">
              URL (extra.url)
              <input
                className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                value={(extraDraft.url as string) ?? ""}
                onChange={(event) => setExtraDraft((prev) => ({ ...prev, url: event.target.value }))}
                onBlur={() => onSave(extraDraft)}
              />
            </label>
          )}
          {isTestimonial && (
            <label className="text-xs text-surface-400 md:col-span-2">
              Rola (extra.role)
              <input
                className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                value={(extraDraft.role as string) ?? ""}
                onChange={(event) => setExtraDraft((prev) => ({ ...prev, role: event.target.value }))}
                onBlur={() => onSave(extraDraft)}
              />
            </label>
          )}
        </div>
      )}
      <label className="text-xs text-surface-400">
        Extra JSON (dowolne pola)
        <textarea
          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[100px]"
          value={jsonValue}
          onChange={(event) => setJsonValue(event.target.value)}
        />
      </label>
      <button className="btn-secondary px-3 py-1.5 text-xs" onClick={handleSaveJson}>
        Zapisz extra JSON
      </button>
    </div>
  );
}

function BlockDraftExtraEditor({
  draft,
  onChange,
}: {
  draft: BlockDraft;
  onChange: (extra: Record<string, unknown>) => void;
}) {
  const [jsonValue, setJsonValue] = useState(() =>
    Object.keys(draft.extra).length ? JSON.stringify(draft.extra, null, 2) : "",
  );

  useEffect(() => {
    setJsonValue(Object.keys(draft.extra).length ? JSON.stringify(draft.extra, null, 2) : "");
  }, [draft.extra]);

  const handleSaveJson = () => {
    try {
      const parsed = jsonValue.trim() ? JSON.parse(jsonValue) : {};
      onChange(parsed);
      pushToast({ title: "Zapisano extra", description: "Dodatkowe pola zapisane." });
    } catch (error) {
      console.error(error);
      pushToast({
        title: "Błąd",
        description: "Nieprawidłowy JSON w polu extra.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-surface-400">
        Extra JSON
        <textarea
          className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[90px]"
          value={jsonValue}
          onChange={(event) => setJsonValue(event.target.value)}
        />
      </label>
      <button className="btn-secondary px-3 py-1.5 text-xs" onClick={handleSaveJson}>
        Zapisz extra JSON
      </button>
    </div>
  );
}

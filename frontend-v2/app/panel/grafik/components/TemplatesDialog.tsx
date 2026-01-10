"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import type { ScheduleTemplateRecord } from "@/lib/api";

interface TemplatesDialogProps {
  open: boolean;
  templates: ScheduleTemplateRecord[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  busy: boolean;
  applyingTemplateId: string | null;
  onClose: () => void;
  onCreateTemplate: (name: string) => void;
  onApplyTemplate: (templateId: string) => void;
}

export function TemplatesDialog({
  open,
  templates,
  loading,
  error,
  creating,
  busy,
  applyingTemplateId,
  onClose,
  onCreateTemplate,
  onApplyTemplate,
}: TemplatesDialogProps) {
  const [templateName, setTemplateName] = useState("");

  const handleCreate = () => {
    if (!templateName.trim()) return;
    onCreateTemplate(templateName.trim());
    setTemplateName("");
  };

  return (
    <Modal
      open={open}
      title="Szablony tygodnia"
      description="Zapisz układ zmian jako szablon lub zastosuj gotowy układ."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Zamknij
          </button>
          <button className="btn-primary" onClick={handleCreate} disabled={creating || busy || !templateName.trim()}>
            {creating ? "Zapisywanie..." : "Zapisz jako szablon"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Nazwa szablonu
          <input
            className="input"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            placeholder="Np. Standardowy tydzień"
          />
        </label>

        {loading && <p className="text-sm text-surface-500">Ładowanie szablonów...</p>}
        {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}

        {!loading && !error && (
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-surface-200/70 px-4 py-6 text-center text-sm text-surface-500 dark:border-surface-800 dark:text-surface-400">
                Brak zapisanych szablonów. Zapisz bieżący tydzień, aby szybko go odtworzyć.
              </div>
            ) : (
              <ul className="space-y-2">
                {templates.map((template) => (
                  <li
                    key={template.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-200/80 px-3 py-2 text-sm dark:border-surface-800"
                  >
                    <div>
                      <p className="font-semibold text-surface-900 dark:text-surface-50">{template.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {template._count?.shifts ?? 0} zmian • {new Date(template.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => onApplyTemplate(template.id)}
                      disabled={!!applyingTemplateId || busy}
                    >
                      {applyingTemplateId === template.id ? "Wdrażanie..." : "Zastosuj"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

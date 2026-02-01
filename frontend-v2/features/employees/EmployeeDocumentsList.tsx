import { EmployeeDocumentRecord, EmployeeDocumentStatus, EmployeeDocumentType } from "@/lib/api";

type EmployeeDocumentsListProps = {
  documents: EmployeeDocumentRecord[];
  documentTypeLabels: Record<EmployeeDocumentType, string>;
  documentStatusLabels: Record<EmployeeDocumentStatus, string>;
  formatFileSize: (bytes: number) => string;
  onEdit: (document: EmployeeDocumentRecord) => void;
  onArchive: (documentId: string) => void;
  onDelete: (documentId: string) => void;
};

export function EmployeeDocumentsList({
  documents,
  documentTypeLabels,
  documentStatusLabels,
  formatFileSize,
  onEdit,
  onArchive,
  onDelete,
}: EmployeeDocumentsListProps) {
  return (
    <div className="mt-4 space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4"
        >
          <div>
            <p className="font-medium text-surface-900">{doc.title}</p>
            <p className="text-xs text-surface-600">
              {documentTypeLabels[doc.type]} • {doc.filename} • {formatFileSize(doc.fileSize)}
            </p>
            <p className="text-xs text-surface-500">
              Wystawiono: {new Date(doc.issuedAt).toLocaleDateString("pl-PL")}
              {doc.expiresAt ? ` • Ważne do: ${new Date(doc.expiresAt).toLocaleDateString("pl-PL")}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                doc.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : doc.status === "EXPIRED"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-surface-200 text-surface-700"
              }`}
            >
              {documentStatusLabels[doc.status]}
            </span>
            <a
              href={doc.downloadUrl}
              className="btn-secondary"
              target="_blank"
              rel="noreferrer"
            >
              Pobierz
            </a>
            <button type="button" onClick={() => onEdit(doc)} className="btn-secondary">
              Edytuj
            </button>
            {doc.status !== "ARCHIVED" && (
              <button type="button" onClick={() => onArchive(doc.id)} className="btn-secondary">
                Archiwizuj
              </button>
            )}
            <button type="button" onClick={() => onDelete(doc.id)} className="btn-danger">
              Usuń
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

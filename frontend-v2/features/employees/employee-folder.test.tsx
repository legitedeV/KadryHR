import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EmployeeDocumentsList } from "./EmployeeDocumentsList";
import { EmployeeContractsList } from "./EmployeeContractsList";

const documentTypeLabels = {
  CERTIFICATE: "Certyfikat",
  SANEPID: "Sanepid",
  MEDICAL: "Medyczne",
  SICK_LEAVE: "Zwolnienie",
  OTHER: "Inne",
} as const;

const documentStatusLabels = {
  ACTIVE: "Aktywny",
  EXPIRED: "Wygasły",
  ARCHIVED: "Archiwum",
} as const;

const contractTypeLabels = {
  UOP: "Umowa o pracę",
  UZ: "Umowa zlecenie",
  B2B: "B2B",
  UOD: "Umowa o dzieło",
} as const;

const contractStatusLabels = {
  ACTIVE: "Aktywna",
  ENDED: "Zakończona",
  SUSPENDED: "Wstrzymana",
} as const;

test("EmployeeDocumentsList renders document metadata", () => {
  const html = renderToStaticMarkup(
    <EmployeeDocumentsList
      documents={[
        {
          id: "doc-1",
          type: "CERTIFICATE",
          title: "Szkolenie BHP",
          description: null,
          issuedAt: "2024-02-01T00:00:00Z",
          expiresAt: "2026-02-01T00:00:00Z",
          status: "ACTIVE",
          filename: "bhp.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          createdAt: "2024-02-01T00:00:00Z",
          downloadUrl: "/api/employees/emp-1/documents/doc-1/download",
        },
      ]}
      documentTypeLabels={documentTypeLabels}
      documentStatusLabels={documentStatusLabels}
      formatFileSize={() => "1 KB"}
      onEdit={() => undefined}
      onArchive={() => undefined}
      onDelete={() => undefined}
    />,
  );

  assert.ok(html.includes("Szkolenie BHP"));
  assert.ok(html.includes("Certyfikat"));
  assert.ok(html.includes("Aktywny"));
});

test("EmployeeContractsList renders contract actions", () => {
  const html = renderToStaticMarkup(
    <EmployeeContractsList
      contracts={[
        {
          id: "contract-1",
          contractType: "UOP",
          rateType: "HOURLY",
          hourlyRate: 40,
          currency: "PLN",
          validFrom: "2024-01-01T00:00:00Z",
          validTo: null,
          status: "ACTIVE",
        },
      ]}
      contractTypeLabels={contractTypeLabels}
      contractStatusLabels={contractStatusLabels}
      formatCurrency={() => "40 zł"}
      onEdit={() => undefined}
      onTerminate={() => undefined}
    />,
  );

  assert.ok(html.includes("Umowa o pracę"));
  assert.ok(html.includes("Zakończ umowę"));
});

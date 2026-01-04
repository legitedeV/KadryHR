import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildShiftDescription, ConfirmDialog } from "./page";
import { EmployeeRecord, LocationRecord, ShiftRecord } from "@/lib/api";

test("delete confirmation dialog renders with overlay above editor", () => {
  const html = renderToStaticMarkup(
    <ConfirmDialog
      title="Usuń zmianę"
      description="Przykładowy opis"
      confirmLabel="Usuń"
      onConfirm={() => {}}
      onCancel={() => {}}
      forceRender
      portalTarget={null}
    />,
  );

  assert(html.includes("z-[60]"));
  assert(html.includes("aria-modal=\"true\""));
  assert(html.includes("Przykładowy opis"));
});

test("shift description contains employee, date, time and location", () => {
  const shift: ShiftRecord = {
    id: "shift-1",
    employeeId: "emp-1",
    locationId: "loc-1",
    startsAt: "2024-01-01T09:00:00.000Z",
    endsAt: "2024-01-01T17:00:00.000Z",
  };

  const employees: EmployeeRecord[] = [
    {
      id: "emp-1",
      firstName: "Anna",
      lastName: "Kowalska",
      avatarUrl: null,
      email: "",
      phone: "",
      position: "",
      locations: [],
      createdAt: "",
      updatedAt: "",
    },
  ];

  const locations: LocationRecord[] = [
    { id: "loc-1", name: "Sklep 1", address: "", employees: [], createdAt: "", updatedAt: "" },
  ];

  const description = buildShiftDescription(shift, employees, locations);
  assert(description.includes("Anna Kowalska"));
  assert(/2024/.test(description));
  assert(description.includes("09:00–17:00"));
  assert(description.includes("Sklep 1"));
});

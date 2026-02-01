import assert from "node:assert/strict";
import test from "node:test";
import { applyLocationUpdate, applyMemberRoleUpdate, validateCompanyForm } from "./organisation-settings.utils";

const baseLocation = {
  id: "loc-1",
  name: "Centrum",
  isActive: true,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const baseMember = {
  id: "user-1",
  email: "user@example.com",
  role: "EMPLOYEE" as const,
  status: "ACTIVE" as const,
};

test("validateCompanyForm returns errors when required fields are missing", () => {
  const errors = validateCompanyForm({ displayName: "", addressCity: "", taxId: "" });
  assert.equal(Object.keys(errors).length, 3);
  assert.ok(errors.displayName);
  assert.ok(errors.addressCity);
  assert.ok(errors.taxId);
});

test("validateCompanyForm passes with valid data", () => {
  const errors = validateCompanyForm({ displayName: "KadryHR", addressCity: "Poznań", taxId: "1234567890" });
  assert.equal(Object.keys(errors).length, 0);
});

test("applyLocationUpdate adds new location at the top", () => {
  const updated = applyLocationUpdate([baseLocation], { ...baseLocation, id: "loc-2", name: "Nowa" }, "create");
  assert.equal(updated[0].id, "loc-2");
});

test("applyLocationUpdate updates existing location", () => {
  const updated = applyLocationUpdate([baseLocation], { ...baseLocation, name: "Zmieniona" }, "update");
  assert.equal(updated[0].name, "Zmieniona");
});

test("applyMemberRoleUpdate updates member role", () => {
  const updated = applyMemberRoleUpdate([baseMember], { id: "user-1", role: "MANAGER" });
  assert.equal(updated[0].role, "MANAGER");
});

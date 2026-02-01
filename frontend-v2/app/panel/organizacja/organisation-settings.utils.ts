import type { OrganisationLocation, OrganisationMember } from "@/lib/api";

export type CompanyFormState = {
  displayName: string;
  addressCity: string;
  taxId: string;
};

export function validateCompanyForm(form: CompanyFormState) {
  const errors: Record<string, string> = {};
  if (!form.displayName.trim()) {
    errors.displayName = "Podaj nazwę wyświetlaną";
  }
  if (!form.addressCity.trim()) {
    errors.addressCity = "Podaj miasto";
  }
  if (!form.taxId.trim()) {
    errors.taxId = "Podaj NIP";
  }
  return errors;
}

export function applyLocationUpdate(
  locations: OrganisationLocation[],
  updated: OrganisationLocation,
  mode: "create" | "update",
) {
  if (mode === "create") {
    return [updated, ...locations];
  }
  return locations.map((loc) => (loc.id === updated.id ? updated : loc));
}

export function applyMemberRoleUpdate(
  members: OrganisationMember[],
  updated: Pick<OrganisationMember, "id" | "role">,
) {
  return members.map((member) =>
    member.id === updated.id ? { ...member, role: updated.role } : member,
  );
}

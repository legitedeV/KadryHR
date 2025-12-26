export type MembershipRole = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";

export type OrganizationSummary = {
  id: string;
  name: string;
  role: MembershipRole;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthenticatedUser;
  organizations: OrganizationSummary[];
  currentOrganization: OrganizationSummary | null;
};

export type ProfileResponse = Omit<AuthResponse, "accessToken">;

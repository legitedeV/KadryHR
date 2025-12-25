import { Membership, MembershipRole, Organization } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId?: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  role: MembershipRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
  organizations: OrganizationSummary[];
  currentOrganization: OrganizationSummary | null;
}

export interface UserWithMemberships {
  id: string;
  email: string;
  fullName?: string | null;
  passwordHash: string;
  memberships: (Membership & { organization: Organization })[];
  createdAt: Date;
  updatedAt: Date;
}

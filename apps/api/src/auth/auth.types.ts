import { MembershipRole } from "@prisma/client";

export type AuthUser = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

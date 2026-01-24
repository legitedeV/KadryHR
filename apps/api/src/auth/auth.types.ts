import { UserRole } from "@prisma/client";

export type AuthUser = {
  userId: string;
  organizationId: string;
  role: UserRole;
};

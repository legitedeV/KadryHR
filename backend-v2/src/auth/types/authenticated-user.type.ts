import { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  organisationId: string;
  role: Role;
};

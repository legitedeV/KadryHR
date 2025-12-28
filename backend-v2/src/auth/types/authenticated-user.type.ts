import { Role } from '../../generated/prisma';

export type AuthenticatedUser = {
  id: string;
  email: string;
  organisationId: string;
  role: Role;
};

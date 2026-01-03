import { Role } from '@prisma/client';
import { Permission } from '../permissions';

export type AuthenticatedUser = {
  id: string;
  email: string;
  organisationId: string;
  role: Role;
  permissions?: Permission[];
  refreshToken?: string;
};

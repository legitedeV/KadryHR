import { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

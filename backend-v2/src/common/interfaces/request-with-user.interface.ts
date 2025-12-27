import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

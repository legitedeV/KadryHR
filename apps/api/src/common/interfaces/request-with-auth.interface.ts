import { FastifyRequest } from 'fastify';
import { MembershipRole, Organization } from '@prisma/client';
import { JwtPayload } from '../../auth/auth.types';

export interface OrgContext {
  orgId: string;
  organization: Organization;
  membershipRole: MembershipRole;
}

export interface RequestWithAuth extends FastifyRequest {
  user?: JwtPayload;
  orgContext?: OrgContext;
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_DEFINITIONS, ROLE_PERMISSIONS } from './permissions.constants';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getRolePermissions() {
    return {
      definitions: PERMISSION_DEFINITIONS,
      roles: ROLE_PERMISSIONS,
    };
  }

  async updateMembershipRole(
    membershipId: string,
    orgId: string,
    role: MembershipRole,
    actorRole: MembershipRole,
  ) {
    const elevatedRoles: MembershipRole[] = [MembershipRole.OWNER, MembershipRole.ADMIN];

    if (!elevatedRoles.includes(actorRole)) {
      throw new ForbiddenException('Only organization owners and admins can manage roles');
    }

    const membership = await this.prisma.membership.findFirst({ where: { id: membershipId, orgId } });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === MembershipRole.OWNER && actorRole !== MembershipRole.OWNER) {
      throw new ForbiddenException('Only owners can update another owner');
    }

    return this.prisma.membership.update({ where: { id: membershipId }, data: { role } });
  }
}

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithAuth } from '../interfaces/request-with-auth.interface';

@Injectable()
export class OrgGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const orgIdFromHeader = this.getOrgIdFromHeader(request);
    const orgId = orgIdFromHeader || user.orgId;

    if (!orgId) {
      throw new BadRequestException('Organization context (X-Org-Id) is required');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.sub,
        orgId,
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access to this organization is forbidden');
    }

    request.orgContext = {
      orgId,
      organization: membership.organization,
      membershipRole: membership.role,
    };

    return true;
  }

  private getOrgIdFromHeader(request: RequestWithAuth): string | undefined {
    const headerValue = request.headers['x-org-id'];

    if (!headerValue) {
      return undefined;
    }

    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }

    return headerValue;
  }
}

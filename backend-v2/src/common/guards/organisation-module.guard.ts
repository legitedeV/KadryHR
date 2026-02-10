import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ORGANISATION_MODULE_KEY } from '../decorators/organisation-module.decorator';
import {
  normalizeOrganisationModules,
  type OrganisationModule,
} from '../constants/organisation-modules.constant';

@Injectable()
export class OrganisationModuleGuard implements CanActivate {
  private readonly logger = new Logger(OrganisationModuleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleName = this.reflector.getAllAndOverride<
      OrganisationModule | undefined
    >(ORGANISATION_MODULE_KEY, [context.getHandler(), context.getClass()]);

    if (!moduleName) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { organisationId?: string }; id?: string }>();

    const organisationId = request.user?.organisationId;
    if (!organisationId) {
      throw new ForbiddenException({
        code: 'MODULE_DISABLED',
        message: 'Brak przypisanej organizacji.',
        module: moduleName,
      });
    }

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { enabledModules: true },
    });

    const modules = normalizeOrganisationModules(organisation?.enabledModules);
    const isEnabled = modules[moduleName] ?? true;

    if (!isEnabled) {
      this.logger.warn(
        `MODULE_DISABLED requestId=${request.id ?? 'n/a'} orgId=${organisationId} module=${moduleName}`,
      );

      throw new ForbiddenException({
        code: 'MODULE_DISABLED',
        message: 'Moduł jest wyłączony dla tej organizacji.',
        module: moduleName,
      });
    }

    return true;
  }
}

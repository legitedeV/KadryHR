import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto, ListUsersQueryDto } from './dto/list-query.dto';
import { Role } from '@prisma/client';
import { UpdatePlatformConfigDto } from './dto/platform-config.dto';
import { AuditService } from '../audit/audit.service';
import { EmailAdapter } from '../email/email.adapter';
import { SmsAdapter } from '../sms/sms.adapter';
import { getPermissionsForRole } from '../auth/permissions';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type { AppConfig } from '../config/configuration';

type FeatureFlagValue = boolean | string | number;

type FeatureFlagEntry = {
  key: string;
  description: string;
  value: FeatureFlagValue;
  type: 'boolean' | 'string' | 'number';
  scope: string;
};

type I18nEntry = {
  key: string;
  translations: Record<string, string>;
  tags: string[];
  updatedAt?: string;
};

type MessageTemplate = {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  body: string;
  type: 'transactional' | 'marketing';
  channel: 'email' | 'sms';
  updatedAt: string;
};

const DEFAULT_THEME_CONFIG = {
  primaryColor: '#1ea574',
  accentColor: '#10b981',
  enableDarkModeOnly: true,
  fontPreset: 'inter',
};

const DEFAULT_FEATURE_FLAGS: FeatureFlagEntry[] = [
  {
    key: 'landing.newHeroEnabled',
    description: 'Nowa wersja sekcji hero na landing page.',
    value: false,
    type: 'boolean',
    scope: 'landing',
  },
  {
    key: 'panel.scheduleBuilderV2',
    description: 'Nowy kreator grafiku w panelu.',
    value: false,
    type: 'boolean',
    scope: 'panel',
  },
  {
    key: 'panel.betaReports',
    description: 'Raporty w wersji beta (panel).',
    value: false,
    type: 'boolean',
    scope: 'panel',
  },
];

const DEFAULT_I18N_ENTRIES: I18nEntry[] = [
  {
    key: 'landing.hero.title',
    translations: { pl: 'KadryHR porządkuje grafik zmianowy' },
    tags: ['landing'],
  },
  {
    key: 'landing.hero.subtitle',
    translations: { pl: 'Planowanie zmian, RCP i urlopy w jednym miejscu.' },
    tags: ['landing'],
  },
  {
    key: 'panel.dashboard.title',
    translations: { pl: 'Dashboard' },
    tags: ['panel'],
  },
  {
    key: 'panel.dashboard.empty',
    translations: { pl: 'Brak danych do wyświetlenia.' },
    tags: ['panel'],
  },
];

const DEFAULT_EMAIL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'invitation',
    name: 'Zaproszenie do organizacji',
    description: 'Wiadomość zapraszająca nowego użytkownika.',
    subject: 'Zaproszenie do KadryHR',
    body: 'Cześć {{name}}, zostałeś/aś zaproszony/a do KadryHR. Kliknij link, aby aktywować konto.',
    type: 'transactional',
    channel: 'email',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'password-reset',
    name: 'Reset hasła',
    description: 'Instrukcje resetu hasła.',
    subject: 'Reset hasła w KadryHR',
    body: 'Kliknij link, aby ustawić nowe hasło. Jeśli to nie Ty, zignoruj wiadomość.',
    type: 'transactional',
    channel: 'email',
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SMS_TEMPLATES: MessageTemplate[] = [
  {
    id: 'shift-assignment',
    name: 'Powiadomienie o zmianie',
    description: 'SMS o przypisaniu zmiany.',
    body: 'KadryHR: nowa zmiana w grafiku. Sprawdź szczegóły w panelu.',
    type: 'transactional',
    channel: 'sms',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'leave-status',
    name: 'Status urlopu',
    description: 'SMS o statusie wniosku urlopowego.',
    body: 'KadryHR: Twój wniosek urlopowy został zaktualizowany. Sprawdź szczegóły.',
    type: 'transactional',
    channel: 'sms',
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailAdapter: EmailAdapter,
    private readonly smsAdapter: SmsAdapter,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async getSystemStats() {
    const [totalOrganisations, totalEmployees, totalUsers, totalShifts] =
      await Promise.all([
        this.prisma.organisation.count(),
        this.prisma.employee.count({ where: { isDeleted: false } }),
        this.prisma.user.count(),
        this.prisma.shift.count(),
      ]);

    return {
      totalOrganisations,
      totalEmployees,
      totalUsers,
      totalShifts,
    };
  }

  async listOrganisations(query: ListQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.organisation.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          createdAt: true,
          _count: {
            select: {
              employees: { where: { isDeleted: false } },
              users: true,
            },
          },
        },
      }),
      this.prisma.organisation.count(),
    ]);

    return {
      data: data.map((org) => ({
        id: org.id,
        name: org.name,
        category: org.category,
        employeeCount: org._count.employees,
        userCount: org._count.users,
        createdAt: org.createdAt.toISOString(),
      })),
      total,
    };
  }

  async listUsers(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: { role?: Role } = {};
    if (query.role && Object.values(Role).includes(query.role as Role)) {
      where.role = query.role as Role;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organisationId: true,
          createdAt: true,
          organisation: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organisationId: user.organisationId,
        organisationName: user.organisation.name,
        createdAt: user.createdAt.toISOString(),
      })),
      total,
    };
  }

  private async ensurePlatformConfig() {
    return this.prisma.platformConfig.upsert({
      where: { id: 'platform' },
      create: {
        id: 'platform',
        frontendConfig: {},
        backendConfig: {},
      },
      update: {},
    });
  }

  async getPlatformConfig() {
    const config = await this.ensurePlatformConfig();
    return {
      id: config.id,
      frontendConfig: config.frontendConfig ?? {},
      backendConfig: config.backendConfig ?? {},
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async updatePlatformConfig(payload: UpdatePlatformConfigDto) {
    const existing = await this.ensurePlatformConfig();
    const frontendConfig =
      payload.frontendConfig ?? existing.frontendConfig ?? {};
    const backendConfig = payload.backendConfig ?? existing.backendConfig ?? {};

    const updated = await this.prisma.platformConfig.update({
      where: { id: existing.id },
      data: {
        frontendConfig,
        backendConfig,
      },
    });

    return {
      id: updated.id,
      frontendConfig: updated.frontendConfig ?? {},
      backendConfig: updated.backendConfig ?? {},
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getSystemStatus() {
    const status = {
      api: 'ok',
      database: 'unknown',
      checkedAt: new Date().toISOString(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      status.database = 'ok';
    } catch {
      status.database = 'error';
    }

    return status;
  }
}

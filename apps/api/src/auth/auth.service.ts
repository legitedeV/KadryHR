import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembershipRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthenticatedUser,
  AuthResponse,
  JwtPayload,
  OrganizationSummary,
  UserWithMemberships,
} from './auth.types';
import { MailQueueService } from '../notifications/mail-queue.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailQueue: MailQueueService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [user, membership] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
        },
      }),
      this.prisma.membership.create({
        data: {
          role: MembershipRole.OWNER,
          organization: {
            create: {
              name: dto.organizationName,
            },
          },
          user: {
            connect: {
              email: dto.email,
            },
          },
        },
        include: { organization: true },
      }),
    ]);

    // Queue welcome email asynchronously to avoid blocking the request lifecycle
    this.mailQueue.queueWelcomeEmail(dto.email, membership.organization.name);

    const organizations = await this.getOrganizationSummaries(user.id);
    const currentOrgId = membership.organization.id;
    const token = this.createToken({
      sub: user.id,
      email: user.email,
      orgId: currentOrgId,
    });

    return {
      accessToken: token,
      user: this.sanitizeUser(user),
      organizations,
      currentOrganization: this.mapOrganizationSummary(
        membership.organization.id,
        membership.organization.name,
        membership.role,
      ),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.memberships.length) {
      throw new UnauthorizedException('User is not assigned to any organization');
    }

    const organizations = this.mapOrganizationSummaries(user.memberships);

    const currentOrganization = organizations[0];

    const token = this.createToken({
      sub: user.id,
      email: user.email,
      orgId: currentOrganization?.id,
    });

    return {
      accessToken: token,
      user: this.sanitizeUser(user),
      organizations,
      currentOrganization,
    };
  }

  async getProfile(userId: string, orgId: string): Promise<Omit<AuthResponse, 'accessToken'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: { include: { organization: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const organizations = this.mapOrganizationSummaries(user.memberships);

    const currentOrganization =
      organizations.find((org) => org.id === orgId) || null;

    return {
      user: this.sanitizeUser(user),
      organizations,
      currentOrganization,
    };
  }

  private async getOrganizationSummaries(
    userId: string,
  ): Promise<OrganizationSummary[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
    });

    return this.mapOrganizationSummaries(memberships);
  }

  private sanitizeUser(user: UserWithMemberships | AuthenticatedUser): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapOrganizationSummary(
    id: string,
    name: string,
    role: MembershipRole,
  ): OrganizationSummary {
    return { id, name, role };
  }

  private mapOrganizationSummaries(
    memberships: (UserWithMemberships['memberships'][number])[],
  ): OrganizationSummary[] {
    return memberships.map((membership) =>
      this.mapOrganizationSummary(
        membership.organization.id,
        membership.organization.name,
        membership.role,
      ),
    );
  }

  private createToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
  }
}

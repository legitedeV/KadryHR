import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { EmploymentType, MembershipRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const slug = await this.createUniqueSlug(data.organizationName);

    const organization = await this.prisma.organization.create({
      data: {
        name: data.organizationName,
        slug,
        email: data.organizationEmail ?? null,
        phone: data.organizationPhone ?? null,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    const membership = await this.prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: MembershipRole.OWNER,
      },
    });

    await this.prisma.employee.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: organization.id,
        email: user.email,
        employmentType: EmploymentType.FULL_TIME,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: membership.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        slug: organization.slug,
      },
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { organization: true },
    });

    if (!membership) {
      throw new UnauthorizedException("User has no organization membership");
    }

    const token = this.jwtService.sign({
      sub: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: membership.role,
      },
    };
  }

  async me(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            slug: true,
            timezone: true,
            weekStart: true,
            locale: true,
            industry: true,
          },
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException();
    }

    return {
      user: {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        role: membership.role,
      },
      organization: membership.organization,
    };
  }

  private async createUniqueSlug(name: string) {
    const base = this.slugify(name);
    let slug = base;
    let attempt = 0;

    while (attempt < 5) {
      const existing = await this.prisma.organization.findUnique({ where: { slug } });
      if (!existing) {
        return slug;
      }
      slug = `${base}-${randomUUID().slice(0, 8)}`;
      attempt += 1;
    }

    return `${base}-${randomUUID()}`;
  }

  private slugify(value: string) {
    const cleaned = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    return cleaned.length > 0 ? cleaned : `org-${randomUUID().slice(0, 8)}`;
  }
}

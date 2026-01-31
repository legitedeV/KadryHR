import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
import { ShiftPresetsService } from '../shift-presets/shift-presets.service';

const DEFAULT_PUBLIC_BASE_URL = 'https://kadryhr.pl';
const DEFAULT_REDIRECT_PATH = '/panel';
const DEFAULT_OAUTH_ERROR_PATH = '/auth/login?error=oauth_failed';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type OAuthProvider = 'google' | 'microsoft';

interface OAuthProfile {
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly shiftPresetsService: ShiftPresetsService,
  ) {}

  private getPublicBaseUrl() {
    const configured =
      this.configService.get<string>('PUBLIC_BASE_URL') ??
      this.configService.get<string>('APP_PUBLIC_URL');
    const env = this.configService.get<string>('NODE_ENV');
    const allowHttp = env !== 'production';
    const fallback = DEFAULT_PUBLIC_BASE_URL;

    if (!configured) {
      return fallback;
    }

    try {
      const parsed = new URL(configured);
      if (
        parsed.protocol === 'https:' ||
        (allowHttp && parsed.protocol === 'http:')
      ) {
        return parsed.toString().replace(/\/$/, '');
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  private getFrontendBaseUrl() {
    const configured =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      this.configService.get<string>('APP_FRONTEND_URL');
    const env = this.configService.get<string>('NODE_ENV');
    const allowHttp = env !== 'production';
    const fallback = DEFAULT_PUBLIC_BASE_URL;

    if (!configured) {
      return fallback;
    }

    try {
      const parsed = new URL(configured);
      if (
        parsed.protocol === 'https:' ||
        (allowHttp && parsed.protocol === 'http:')
      ) {
        return parsed.toString().replace(/\/$/, '');
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  private getRedirectUri(provider: OAuthProvider) {
    return `${this.getPublicBaseUrl()}/api/auth/oauth/${provider}/callback`;
  }

  private getProviderConfig(provider: OAuthProvider) {
    if (provider === 'google') {
      return {
        provider,
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        scopes: ['openid', 'email', 'profile'],
      };
    }

    const tenant =
      this.configService.get<string>('MICROSOFT_TENANT_ID') || 'common';
    return {
      provider,
      authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      profileUrl: 'https://graph.microsoft.com/v1.0/me',
      clientId: this.configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: this.configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      scopes: ['openid', 'email', 'profile', 'User.Read'],
    };
  }

  private getCookieBaseOptions() {
    const secure = this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      domain: secure ? '.kadryhr.pl' : undefined,
      path: '/',
    };
  }

  private getStateCookieName(provider: OAuthProvider) {
    return `oauth_state_${provider}`;
  }

  private getRedirectCookieName(provider: OAuthProvider) {
    return `oauth_redirect_${provider}`;
  }

  private createRequestId() {
    return randomUUID();
  }

  private isValidRedirectPath(redirect: string) {
    const trimmed = redirect.trim();
    return /^\/(?!\/)/.test(trimmed);
  }

  private resolveRedirectPath(redirect?: string) {
    if (!redirect) {
      return DEFAULT_REDIRECT_PATH;
    }

    const trimmed = redirect.trim();
    if (this.isValidRedirectPath(trimmed)) {
      return trimmed;
    }

    return DEFAULT_REDIRECT_PATH;
  }

  private buildErrorRedirect() {
    return `${this.getFrontendBaseUrl()}${DEFAULT_OAUTH_ERROR_PATH}`;
  }

  private sendOAuthError(
    res: Response,
    status: number,
    code: string,
    requestId: string,
    extra?: Record<string, unknown>,
  ) {
    return res.status(status).json({
      statusCode: status,
      error: code,
      message: code,
      requestId,
      ...extra,
    });
  }

  private sanitizeErrorMessage(message?: string) {
    if (!message) {
      return message;
    }
    return message
      .replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        '[redacted-email]',
      )
      .replace(
        /\b(code|state|token|client_secret)=([^\s&]+)/gi,
        '$1=[redacted]',
      );
  }

  private sanitizePrismaMeta(meta: Prisma.PrismaClientKnownRequestError['meta']) {
    if (!meta || typeof meta !== 'object') {
      return meta;
    }

    const sanitizeValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return this.sanitizeErrorMessage(value);
      }
      if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
      }
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, nested]) => [
            key,
            sanitizeValue(nested),
          ]),
        );
      }
      return value;
    };

    return sanitizeValue(meta);
  }

  private mapOAuthDbError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { status: HttpStatus.CONFLICT, code: 'oauth_user_conflict' };
      }
      if (error.code === 'P2003') {
        return { status: HttpStatus.CONFLICT, code: 'oauth_fk_missing' };
      }
      if (error.code === 'P2025') {
        return { status: HttpStatus.NOT_FOUND, code: 'oauth_record_missing' };
      }
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'oauth_db_failed' };
  }

  private logOAuthDbError(
    error: unknown,
    context: { requestId: string; provider: OAuthProvider },
  ) {
    const errorClass =
      error instanceof Error ? error.constructor.name : typeof error;
    const basePayload = { ...context, errorClass };

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        'OAuth user persistence failed',
        JSON.stringify({
          ...basePayload,
          prismaCode: error.code,
          meta: this.sanitizePrismaMeta(error.meta),
        }),
      );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(
        'OAuth user persistence failed',
        JSON.stringify({
          ...basePayload,
          prismaValidationMessage: this.sanitizeErrorMessage(error.message),
        }),
      );
    } else {
      this.logger.error(
        'OAuth user persistence failed',
        JSON.stringify(basePayload),
      );
    }

    if (error instanceof Error && error.stack) {
      this.logger.error(
        'OAuth user persistence stack',
        this.sanitizeErrorMessage(error.stack),
      );
    }
  }

  private parseProviderError(body: string) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const error = typeof parsed.error === 'string' ? parsed.error : undefined;
      const description =
        typeof parsed.error_description === 'string'
          ? parsed.error_description
          : undefined;
      if (error || description) {
        return [error, description].filter(Boolean).join(': ');
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  async start(provider: OAuthProvider, req: Request, res: Response) {
    const requestId = this.createRequestId();
    const config = this.getProviderConfig(provider);
    if (!config.clientId || !config.clientSecret) {
      throw new BadRequestException('OAuth provider is not configured');
    }

    const redirectParam =
      typeof req.query.redirect === 'string' ? req.query.redirect : undefined;
    if (redirectParam && !this.isValidRedirectPath(redirectParam)) {
      this.logger.warn(
        `Invalid OAuth redirect provided`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_invalid_redirect',
        requestId,
        { provider },
      );
    }

    const state = randomBytes(24).toString('hex');
    const redirectPath = this.resolveRedirectPath(redirectParam);

    res.cookie(this.getStateCookieName(provider), state, {
      ...this.getCookieBaseOptions(),
      maxAge: OAUTH_STATE_TTL_MS,
    });
    res.cookie(this.getRedirectCookieName(provider), redirectPath, {
      ...this.getCookieBaseOptions(),
      maxAge: OAUTH_STATE_TTL_MS,
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.getRedirectUri(provider),
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
    });

    if (provider === 'microsoft') {
      params.set('response_mode', 'query');
    }

    const url = `${config.authorizeUrl}?${params.toString()}`;
    this.logger.log(
      `OAuth start redirect issued`,
      JSON.stringify({ requestId, provider }),
    );
    return res.redirect(url);
  }

  async callback(provider: OAuthProvider, req: Request, res: Response) {
    const requestId = this.createRequestId();
    const config = this.getProviderConfig(provider);
    if (!config.clientId || !config.clientSecret) {
      this.logger.error(
        `OAuth provider not configured`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_provider_not_configured',
        requestId,
        { provider },
      );
    }

    const code =
      typeof req.query.code === 'string' ? req.query.code : undefined;
    const state =
      typeof req.query.state === 'string' ? req.query.state : undefined;
    const stateCookie = req.cookies?.[this.getStateCookieName(provider)] as
      | string
      | undefined;
    const redirectCookie = req.cookies?.[
      this.getRedirectCookieName(provider)
    ] as string | undefined;

    res.clearCookie(
      this.getStateCookieName(provider),
      this.getCookieBaseOptions(),
    );
    res.clearCookie(
      this.getRedirectCookieName(provider),
      this.getCookieBaseOptions(),
    );

    if (!code) {
      this.logger.warn(
        `OAuth callback missing code`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_missing_code',
        requestId,
        { provider },
      );
    }

    if (!state) {
      this.logger.warn(
        `OAuth callback missing state param`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_missing_state_param',
        requestId,
        { provider },
      );
    }

    if (!stateCookie) {
      this.logger.warn(
        `OAuth callback missing state cookie`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_missing_state_cookie',
        requestId,
        { provider },
      );
    }

    if (state !== stateCookie) {
      this.logger.warn(
        `OAuth state mismatch`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_state_mismatch',
        requestId,
        { provider },
      );
    }

    let tokens: { access_token?: string };
    try {
      const tokenParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.getRedirectUri(provider),
      });

      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      const tokenBody = await tokenResponse.text();
      if (!tokenResponse.ok) {
        const providerError = this.parseProviderError(tokenBody);
        this.logger.warn(
          `OAuth token exchange failed`,
          JSON.stringify({ requestId, provider, providerError }),
        );
        return this.sendOAuthError(
          res,
          HttpStatus.BAD_GATEWAY,
          'oauth_token_exchange_failed',
          requestId,
          { provider, providerError },
        );
      }

      tokens = JSON.parse(tokenBody) as { access_token?: string };
    } catch (error) {
      this.logger.error(
        `OAuth token exchange error`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_GATEWAY,
        'oauth_token_exchange_failed',
        requestId,
        { provider },
      );
    }

    if (!tokens.access_token) {
      this.logger.warn(
        `OAuth token missing access token`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_GATEWAY,
        'oauth_token_exchange_failed',
        requestId,
        { provider },
      );
    }

    let profile: OAuthProfile;
    try {
      profile = await this.fetchProfile(provider, tokens.access_token);
    } catch {
      this.logger.error(
        `OAuth userinfo fetch failed`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_GATEWAY,
        'oauth_userinfo_failed',
        requestId,
        { provider },
      );
    }
    if (!profile.email || (provider === 'google' && !profile.emailVerified)) {
      this.logger.warn(
        `OAuth email not verified`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_email_not_verified',
        requestId,
        { provider },
      );
    }

    let userId: string;
    try {
      const user = await this.findOrCreateUser(provider, profile);
      userId = user.id;
      await this.authService.createSessionForUser(user.id, res);
    } catch (error) {
      this.logOAuthDbError(error, { requestId, provider });
      const mapped = this.mapOAuthDbError(error);
      return this.sendOAuthError(
        res,
        mapped.status,
        mapped.code,
        requestId,
        { provider },
      );
    }

    if (!redirectCookie) {
      this.logger.warn(
        `OAuth redirect cookie missing`,
        JSON.stringify({ requestId, provider, userId }),
      );
    } else if (!this.isValidRedirectPath(redirectCookie)) {
      this.logger.warn(
        `OAuth redirect cookie invalid`,
        JSON.stringify({ requestId, provider, userId }),
      );
    }

    const redirectPath = this.resolveRedirectPath(redirectCookie);
    this.logger.log(
      `OAuth callback success`,
      JSON.stringify({ requestId, provider, userId }),
    );
    return res.redirect(redirectPath);
  }

  private async fetchProfile(provider: OAuthProvider, accessToken: string) {
    const config = this.getProviderConfig(provider);
    const response = await fetch(config.profileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new HttpException(
        'OAuth profile fetch failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (await response.json()) as Record<string, any>;

    if (provider === 'google') {
      return {
        providerAccountId: data.sub,
        email: data.email,
        emailVerified: data.email_verified === true,
        firstName: data.given_name ?? null,
        lastName: data.family_name ?? null,
        avatarUrl: data.picture ?? null,
      } satisfies OAuthProfile;
    }

    return {
      providerAccountId: data.id,
      email: data.mail ?? data.userPrincipalName ?? data.preferred_username,
      emailVerified: true,
      firstName: data.givenName ?? null,
      lastName: data.surname ?? null,
      avatarUrl: null,
    } satisfies OAuthProfile;
  }

  private resolveProfileNames(profile: OAuthProfile) {
    const fallbackSeed = profile.email.split('@')[0] || 'KadryHR';
    const [firstCandidate, ...rest] = fallbackSeed
      .split(/[._-]+/)
      .filter(Boolean);
    const fallbackFirst = firstCandidate || fallbackSeed;
    const fallbackLast = rest.join(' ') || fallbackSeed;

    return {
      firstName: profile.firstName ?? fallbackFirst,
      lastName: profile.lastName ?? fallbackLast,
    };
  }

  private async resolveDefaultOrganisationId(
    tx: Prisma.TransactionClient,
  ) {
    const configuredId =
      this.configService.get<string>('DEFAULT_ORGANISATION_ID');
    if (configuredId) {
      const configured = await tx.organisation.findUnique({
        where: { id: configuredId },
      });
      if (configured) {
        return { organisationId: configured.id, created: false };
      }
      this.logger.warn(
        `Default organisation id not found`,
        JSON.stringify({ organisationId: configuredId }),
      );
    }

    const defaultOrgName = 'Default';
    const existingDefault = await tx.organisation.findFirst({
      where: { name: defaultOrgName },
    });
    if (existingDefault) {
      return { organisationId: existingDefault.id, created: false };
    }

    const organisation = await tx.organisation.create({
      data: { name: defaultOrgName },
    });

    return { organisationId: organisation.id, created: true };
  }

  private async findOrCreateUser(
    provider: OAuthProvider,
    profile: OAuthProfile,
  ) {
    if (!profile.providerAccountId) {
      throw new BadRequestException('OAuth profile is missing identifier');
    }

    const resolvedNames = this.resolveProfileNames(profile);
    const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);

    const { user, createdOrganisationId } = await this.prisma.$transaction(
      async (tx) => {
        const existingAccount = await tx.oauthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId: profile.providerAccountId,
            },
          },
          include: { user: true },
        });

        if (existingAccount?.user) {
          const updatedUser = await tx.user.update({
            where: { id: existingAccount.user.id },
            data: {
              email: profile.email,
              firstName: resolvedNames.firstName ?? undefined,
              lastName: resolvedNames.lastName ?? undefined,
              avatarUrl: profile.avatarUrl ?? undefined,
            },
          });

          await tx.employee.upsert({
            where: { userId: updatedUser.id },
            create: {
              organisationId: updatedUser.organisationId,
              userId: updatedUser.id,
              firstName: resolvedNames.firstName,
              lastName: resolvedNames.lastName,
              email: profile.email,
            },
            update: {
              firstName: resolvedNames.firstName,
              lastName: resolvedNames.lastName,
              email: profile.email,
            },
          });

          return { user: updatedUser, createdOrganisationId: null };
        }

        let createdOrganisationId: string | null = null;
        const existingUser = await tx.user.findUnique({
          where: { email: profile.email },
          select: { id: true, organisationId: true },
        });
        let organisationId = existingUser?.organisationId;
        if (!organisationId) {
          const resolved = await this.resolveDefaultOrganisationId(tx);
          organisationId = resolved.organisationId;
          createdOrganisationId = resolved.created ? resolved.organisationId : null;
        }

        const user = await tx.user.upsert({
          where: { email: profile.email },
          create: {
            email: profile.email,
            passwordHash,
            role: Role.OWNER,
            organisationId,
            firstName: resolvedNames.firstName ?? undefined,
            lastName: resolvedNames.lastName ?? undefined,
            avatarUrl: profile.avatarUrl ?? undefined,
          },
          update: {
            firstName: resolvedNames.firstName ?? undefined,
            lastName: resolvedNames.lastName ?? undefined,
            avatarUrl: profile.avatarUrl ?? undefined,
          },
        });

        await tx.oauthAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId: profile.providerAccountId,
            },
          },
          create: {
            provider,
            providerAccountId: profile.providerAccountId,
            userId: user.id,
          },
          update: {
            userId: user.id,
          },
        });

        await tx.employee.upsert({
          where: { userId: user.id },
          create: {
            organisationId: user.organisationId,
            userId: user.id,
            firstName: resolvedNames.firstName,
            lastName: resolvedNames.lastName,
            email: profile.email,
          },
          update: {
            firstName: resolvedNames.firstName,
            lastName: resolvedNames.lastName,
            email: profile.email,
          },
        });

        return { user, createdOrganisationId };
      },
    );

    if (createdOrganisationId) {
      await this.shiftPresetsService.createDefaultPresets(createdOrganisationId);
    }

    return user;
  }
}

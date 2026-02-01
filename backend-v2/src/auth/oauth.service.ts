import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
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

  private resolveProvider(provider: string): OAuthProvider | null {
    if (provider === 'google' || provider === 'microsoft') {
      return provider;
    }
    return null;
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

  private decodeCookieValue(value: unknown) {
    if (typeof value !== 'string' || value.length === 0) {
      return undefined;
    }
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
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
    if (error instanceof Prisma.PrismaClientValidationError) {
      return { status: HttpStatus.BAD_REQUEST, code: 'oauth_db_validation' };
    }
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
    const message =
      error instanceof Error
        ? this.sanitizeErrorMessage(error.message)
        : undefined;
    const stack =
      error instanceof Error && error.stack
        ? this.sanitizeErrorMessage(error.stack)
        : undefined;
    const basePayload = { ...context, errorClass, message, stack };

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        'OAuth user persistence failed',
        JSON.stringify({
          ...basePayload,
          prismaCode: error.code,
          prismaMessage: message,
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

  async start(provider: string, req: Request, res: Response) {
    const requestId = this.createRequestId();
    const resolvedProvider = this.resolveProvider(provider);
    if (!resolvedProvider) {
      this.logger.warn(
        `OAuth unknown provider`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_unknown_provider',
        requestId,
        { provider },
      );
    }
    const config = this.getProviderConfig(resolvedProvider);
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

    res.cookie(this.getStateCookieName(resolvedProvider), state, {
      ...this.getCookieBaseOptions(),
      maxAge: OAUTH_STATE_TTL_MS,
    });
    res.cookie(this.getRedirectCookieName(resolvedProvider), redirectPath, {
      ...this.getCookieBaseOptions(),
      maxAge: OAUTH_STATE_TTL_MS,
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.getRedirectUri(resolvedProvider),
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
    });

    if (resolvedProvider === 'microsoft') {
      params.set('response_mode', 'query');
    }

    const url = `${config.authorizeUrl}?${params.toString()}`;
    this.logger.log(
      `OAuth start redirect issued`,
      JSON.stringify({ requestId, provider: resolvedProvider }),
    );
    return res.redirect(url);
  }

  async callback(provider: string, req: Request, res: Response) {
    const requestId = this.createRequestId();
    const resolvedProvider = this.resolveProvider(provider);
    if (!resolvedProvider) {
      this.logger.warn(
        `OAuth unknown provider`,
        JSON.stringify({ requestId, provider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_unknown_provider',
        requestId,
        { provider },
      );
    }
    const config = this.getProviderConfig(resolvedProvider);
    if (!config.clientId || !config.clientSecret) {
      this.logger.error(
        `OAuth provider not configured`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_provider_not_configured',
        requestId,
        { provider: resolvedProvider },
      );
    }

    const code =
      typeof req.query.code === 'string' ? req.query.code : undefined;
    const state =
      typeof req.query.state === 'string' ? req.query.state : undefined;
    const stateCookie = this.decodeCookieValue(
      req.cookies?.[this.getStateCookieName(resolvedProvider)],
    );
    const redirectCookie = this.decodeCookieValue(
      req.cookies?.[this.getRedirectCookieName(resolvedProvider)],
    );

    res.clearCookie(
      this.getStateCookieName(resolvedProvider),
      this.getCookieBaseOptions(),
    );
    res.clearCookie(
      this.getRedirectCookieName(resolvedProvider),
      this.getCookieBaseOptions(),
    );

    if (!code) {
      this.logger.warn(
        `OAuth callback missing code`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_missing_code',
        requestId,
        { provider: resolvedProvider },
      );
    }

    if (!state) {
      this.logger.warn(
        `OAuth callback missing state param`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_missing_state_param',
        requestId,
        { provider: resolvedProvider },
      );
    }

    if (!stateCookie) {
      this.logger.warn(
        `OAuth callback missing state cookie`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_missing_state_cookie',
        requestId,
        { provider: resolvedProvider },
      );
    }

    if (state !== stateCookie) {
      this.logger.warn(
        `OAuth state mismatch`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_state_mismatch',
        requestId,
        { provider: resolvedProvider },
      );
    }

    let tokens: { access_token?: string };
    try {
      const tokenParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.getRedirectUri(resolvedProvider),
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
          JSON.stringify({ requestId, provider: resolvedProvider, providerError }),
        );
        return this.sendOAuthError(
          res,
          HttpStatus.BAD_GATEWAY,
          'oauth_token_exchange_failed',
          requestId,
          { provider: resolvedProvider, providerError },
        );
      }

      tokens = JSON.parse(tokenBody) as { access_token?: string };
    } catch (error) {
      this.logger.error(
        `OAuth token exchange error`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_GATEWAY,
        'oauth_token_exchange_failed',
        requestId,
        { provider: resolvedProvider },
      );
    }

    if (!tokens.access_token) {
      this.logger.warn(
        `OAuth token missing access token`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_GATEWAY,
        'oauth_token_exchange_failed',
        requestId,
        { provider: resolvedProvider },
      );
    }

    let profile: OAuthProfile;
    try {
      profile = await this.fetchProfile(resolvedProvider, tokens.access_token);
    } catch {
      this.logger.error(
        `OAuth userinfo fetch failed`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_GATEWAY,
        'oauth_userinfo_failed',
        requestId,
        { provider: resolvedProvider },
      );
    }
    if (
      !profile.email ||
      (resolvedProvider === 'google' && !profile.emailVerified)
    ) {
      this.logger.warn(
        `OAuth email not verified`,
        JSON.stringify({ requestId, provider: resolvedProvider }),
      );
      return this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'oauth_email_not_verified',
        requestId,
        { provider: resolvedProvider },
      );
    }

    let userId: string;
    try {
      const user = await this.findOrCreateUser(
        resolvedProvider,
        profile,
        requestId,
      );
      userId = user.id;
      await this.authService.createSessionForUser(user.id, res);
    } catch (error) {
      this.logOAuthDbError(error, { requestId, provider: resolvedProvider });
      const mapped = this.mapOAuthDbError(error);
      if (mapped.code === 'oauth_db_failed') {
        const errorClass =
          error instanceof Error ? error.constructor.name : typeof error;
        const message =
          error instanceof Error
            ? this.sanitizeErrorMessage(error.message)
            : undefined;
        const stack =
          error instanceof Error && error.stack
            ? this.sanitizeErrorMessage(error.stack)
            : undefined;
        const payload: Record<string, unknown> = {
          requestId,
          provider: resolvedProvider,
          errorClass,
          message,
          stack,
        };

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          payload.prismaCode = error.code;
          payload.meta = this.sanitizePrismaMeta(error.meta);
        }
        if (error instanceof Prisma.PrismaClientValidationError) {
          payload.prismaValidationMessage = this.sanitizeErrorMessage(
            error.message,
          );
        }

        this.logger.error(
          'OAuth callback failed with oauth_db_failed',
          JSON.stringify(payload),
        );
      }
      return this.sendOAuthError(
        res,
        mapped.status,
        mapped.code,
        requestId,
        { provider: resolvedProvider },
      );
    }

    if (!redirectCookie) {
      this.logger.warn(
        `OAuth redirect cookie missing`,
        JSON.stringify({ requestId, provider: resolvedProvider, userId }),
      );
    } else if (!this.isValidRedirectPath(redirectCookie)) {
      this.logger.warn(
        `OAuth redirect cookie invalid`,
        JSON.stringify({ requestId, provider: resolvedProvider, userId }),
      );
    }

    const redirectPath = this.resolveRedirectPath(redirectCookie);
    this.logger.log(
      `OAuth callback success`,
      JSON.stringify({ requestId, provider: resolvedProvider, userId }),
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
    const emailSeed =
      typeof profile.email === 'string' && profile.email.length > 0
        ? profile.email
        : 'KadryHR';
    const fallbackSeed = emailSeed.split('@')[0] || 'KadryHR';
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
    requestId: string,
  ) {
    if (!profile.providerAccountId) {
      throw new BadRequestException('OAuth profile is missing identifier');
    }

    const resolvedNames = this.resolveProfileNames(profile);
    const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);

    const { user, createdOrganisationId } = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (
          !tx ||
          typeof (tx as Prisma.TransactionClient)?.user?.findUnique !==
            'function'
        ) {
          this.logger.error(
            'OAuth transaction client invalid',
            JSON.stringify({ requestId, provider }),
          );
          throw new InternalServerErrorException('oauth_tx_invalid');
        }
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

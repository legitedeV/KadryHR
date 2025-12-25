import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { captureException, isSentryEnabled } from '../observability/sentry-lite';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    if (isSentryEnabled()) {
      try {
        const context = host.switchToHttp();
        const request = context.getRequest();

        await captureException(exception, {
          request: {
            method: request?.method,
            url: request?.url,
            headers: request?.headers,
          },
        });
      } catch (error) {
        // Swallow errors from the monitoring pipeline to avoid cascading failures
        console.error('Failed to report exception to Sentry', error);
      }
    }

    super.catch(exception as HttpException, host);
  }
}

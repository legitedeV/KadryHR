import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const organisationId = request.user?.organisationId;

    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.filter((item) => item.organisationId === organisationId);
        }
        if (data && typeof data === 'object' && 'organisationId' in data) {
          if (data.organisationId !== organisationId) {
            return null;
          }
        }
        return data;
      }),
    );
  }
}

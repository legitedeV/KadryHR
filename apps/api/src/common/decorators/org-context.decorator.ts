import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  OrgContext,
  RequestWithAuth,
} from '../interfaces/request-with-auth.interface';

export const OrgContextDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): OrgContext | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    return request.orgContext;
  },
);

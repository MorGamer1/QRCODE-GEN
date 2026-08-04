import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  /** Present when the request was authenticated via an API key rather than a user session. */
  apiKeyId?: string;
  apiKeyScopes?: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);

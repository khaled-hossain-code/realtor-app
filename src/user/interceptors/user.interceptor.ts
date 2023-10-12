import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';

export class UserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle();
  }
}

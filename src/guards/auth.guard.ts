import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      jwt.verify(token, process.env.JSON_TOKEN_KEY, (err, decoded) => {
        if (err) {
          throw new UnauthorizedException();
        } else {
          request['user'] = decoded;
        }
      });
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request): string | undefined {
    return request.headers.authorization?.split('Bearer ')[1];
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
 Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

import { JWT_ACCESS_SECRET, } from '../common/config/env';
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName: string;
        roles: string[];
      };
    }
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Authentication required');

    try {
      const payload = this.jwtService.verify<{ sub: string; type: string }>(token, {
        secret: JWT_ACCESS_SECRET,
      });
      if (payload.type !== 'access') throw new Error('Invalid token type');

      const user = await this.authService.validateUser(payload.sub);
      if (!user) throw new Error('User not found');
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    return request.cookies?.['studnet_access'] as string | undefined;
  }
}

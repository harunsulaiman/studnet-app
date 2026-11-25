import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

import { JWT_ACCESS_SECRET, } from '../common/config/env';
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService, @Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ cookies?: Record<string, string>; headers: Record<string, string>; user?: unknown }>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : request.cookies?.['studnet_access'];
    if (token) {
      try {
        const payload = this.jwtService.verify<{ sub: string; type: string }>(token, { secret: JWT_ACCESS_SECRET });
        if (payload.type === 'access') request.user = await this.authService.validateUser(payload.sub);
      } catch {
        // Anonymous access is allowed; ignore invalid optional tokens.
      }
    }
    return true;
  }
}

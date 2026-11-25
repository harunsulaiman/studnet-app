import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../common/config/env';
@Injectable()
export class TokenRefreshService {
 constructor(
 @Inject(PrismaService) private readonly prisma: PrismaService,
 @Inject(TokenService) private readonly tokenService: TokenService,
 @Inject(JwtService) private readonly jwtService: JwtService,
 @Inject(AuthService) private readonly authService: AuthService,
 ) {}

 async refresh(refreshToken: string): Promise<{ accessToken: string }> {
 const hash = this.tokenService.hashToken(refreshToken);
 try {
 const session = await this.prisma.session.findUnique({ where: { refreshHash: hash } });
 if (session && session.expiresAt >= new Date()) {
 return this.signAccess(session.userId);
 }
 } catch {
 // Fall back to stateless local refresh when the database is unavailable.
 }
 const payload = this.jwtService.decode(refreshToken) as { sub?: string; type?: string } | null;
 if (payload?.type !== 'refresh' || !payload.sub || !(await this.authService.validateUser(payload.sub))) {
 throw new UnauthorizedException('Invalid refresh token');
 }
 return this.signAccess(payload.sub);
 }

 private signAccess(userId: string): { accessToken: string } {
 return { accessToken: this.jwtService.sign({ sub: userId, type: 'access' }, { secret: JWT_ACCESS_SECRET, expiresIn: '15m' }) };
 }
}
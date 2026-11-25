import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { JWT_ACCESS_SECRET } from '../common/config/env';

@Injectable()
export class TokenRefreshService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const hash = this.tokenService.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshHash: hash } });
    if (!session || session.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');
    const payload = this.jwtService.verify<{ sub?: string; type?: string }>(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    if (payload.type !== 'refresh' || payload.sub !== session.userId) throw new UnauthorizedException('Invalid refresh token');
    return { accessToken: this.jwtService.sign({ sub: session.userId, type: 'access' }, { secret: JWT_ACCESS_SECRET, expiresIn: '15m' }) };
  }
}
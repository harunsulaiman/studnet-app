import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../common/config/env';
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  issuePair(userId: string): TokenPair {
    const accessToken = this.jwtService.sign(
      { sub: userId, type: 'access' },
      {
        secret: JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign({ sub: userId, type: 'refresh' }, { secret: JWT_REFRESH_SECRET || JWT_ACCESS_SECRET, expiresIn: '30d' });
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return { accessToken, refreshToken, refreshTokenHash, expiresAt };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

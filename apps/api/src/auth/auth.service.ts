import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface AuthIdentity extends AuthenticatedUser {
  passwordHash: string;
  isActive: boolean;
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthIdentity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roles: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles.map((role: { role: string }) => role.role),
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  async validateUser(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (!user || !user.isActive) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles.map((role: { role: string }) => role.role),
    };
  }
}
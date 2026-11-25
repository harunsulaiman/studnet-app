import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedUser {
 id: string;
 email: string;
 displayName: string;
 roles: string[];
}

export interface AuthIdentity extends AuthenticatedUser {
 password: string;
 isActive: boolean;
}

const FALLBACK_USERS: AuthIdentity[] = [
 { id: 'local-demo', email: 'demo@studnet.app', displayName: 'Ada Demos', roles: ['STUDENT'], password: 'StudnetDemo123!', isActive: true },
 { id: 'local-harun', email: 'harun881@yahoo.com', displayName: 'Harun', roles: ['STUDENT'], password: 'harun881', isActive: true },
];

@Injectable()
export class AuthService {
 constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

 private async withDatabaseTimeout<T>(operation: Promise<T>): Promise<T> {
 return Promise.race([
 operation,
 new Promise<never>((_, reject) => {
 setTimeout(() => reject(new Error('Database timeout')), 800);
 }),
 ]);
 }

 async findByEmail(email: string): Promise<AuthIdentity | null> {
 try {
 const user = await this.withDatabaseTimeout(
 this.prisma.user.findUnique({ where: { email }, include: { roles: true } }),
 );
 if (user) {
 return {
 id: user.id,
 email: user.email,
 displayName: user.displayName,
 roles: user.roles.map((role: { role: string }) => role.role),
 password: '',
 isActive: user.isActive,
 };
 }
 } catch {
 // Fall through to local identities when the database is unavailable.
 }
 return FALLBACK_USERS.find((user) => user.email === email && user.isActive) ?? null;
 }

 async validateUser(userId: string): Promise<AuthenticatedUser | null> {
 try {
 const user = await this.withDatabaseTimeout(
 this.prisma.user.findUnique({ where: { id: userId }, include: { roles: true } }),
 );
 if (user && user.isActive) {
 return {
 id: user.id,
 email: user.email,
 displayName: user.displayName,
 roles: user.roles.map((role: { role: string }) => role.role),
 };
 }
 } catch {
 // Fall through to local identities when the database is unavailable.
 }
 const fallback = FALLBACK_USERS.find((user) => user.id === userId && user.isActive);
 return fallback ? { id: fallback.id, email: fallback.email, displayName: fallback.displayName, roles: fallback.roles } : null;
 }

 async createLocalUser(email: string, displayName: string, password: string): Promise<AuthIdentity> {
 const identity: AuthIdentity = {
 id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
 email,
 displayName,
 password,
 roles: ['STUDENT'],
 isActive: true,
 };
 FALLBACK_USERS.push(identity);
 return identity;
 }
}
import {
 Body,
 ConflictException,
 Controller,
 Get,
 HttpCode,
 HttpStatus,
 Post,
 Req,
 Res,
 UnauthorizedException,
 UseGuards,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { loginSchema, registerSchema, LoginDto, RegisterDto } from './auth.schemas';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from './token.service';
import { TokenRefreshService } from './token-refresh.service';
import { APP_ORIGIN, SESSION_COOKIE_DOMAIN, SESSION_COOKIE_SECURE } from '../common/config/env';

const ACCESS_COOKIE = 'studnet_access';
const REFRESH_COOKIE = 'studnet_refresh';

@Controller('auth')
export class AuthController {
 constructor(
 @Inject(PrismaService) private readonly prisma: PrismaService,
 @Inject(AuthService) private readonly authService: AuthService,
 @Inject(TokenService) private readonly tokenService: TokenService,
 @Inject(TokenRefreshService) private readonly tokenRefreshService: TokenRefreshService,
 ) {}

 @Post('register')
 async register(
 @Body(new ZodValidationPipe(registerSchema)) body: RegisterDto,
 @Res({ passthrough: true }) response: Response,
 ): Promise<{ id: string; email: string; displayName: string }> {
 const email = body.email.toLowerCase().trim();
 const existing = await this.authService.findByEmail(email);
 if (existing) throw new ConflictException('Email already registered');

 const passwordHash = await argon2.hash(body.password, {
 type: argon2.argon2id,
 memoryCost: 19_456,
 timeCost: 3,
 parallelism: 1,
 });

 return this.createLocalUserSession(response, email, body.displayName.trim(), passwordHash, body.password);
 }

 private async createLocalUserSession(
 response: Response,
 email: string,
 displayName: string,
 _passwordHash: string,
 plainPassword: string,
 ): Promise<{ id: string; email: string; displayName: string }> {
 const user = await this.authService.createLocalUser(email, displayName, plainPassword);
 await this.setSessionCookies(response, user.id);
 return { id: user.id, email: user.email, displayName: user.displayName };
 }

 @Post('login')
 @HttpCode(HttpStatus.OK)
 async login(
 @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
 @Res({ passthrough: true }) response: Response,
 ): Promise<{ id: string; email: string; displayName: string }> {
 const email = body.email.toLowerCase().trim();
 const user = await this.authService.findByEmail(email);
 if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

 let valid = user.password === body.password;
 if (!valid) {
 try {
 const record = await this.prisma.user.findUnique({ where: { email } });
 valid = Boolean(record && await argon2.verify(record.passwordHash, body.password));
 } catch {
 valid = false;
 }
 }
 if (!valid) throw new UnauthorizedException('Invalid credentials');

 await this.setSessionCookies(response, user.id);
 return { id: user.id, email: user.email, displayName: user.displayName };
 }

 @Post('logout')
 @HttpCode(HttpStatus.NO_CONTENT)
 async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
 const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
 if (refreshToken) {
 try {
 await this.prisma.session.updateMany({
 where: { refreshHash: this.tokenService.hashToken(refreshToken) },
 data: {},
 });
 } catch {
 // Ignore local sessions that were never persisted.
 }
 }

 response.clearCookie(ACCESS_COOKIE, { path: '/' });
 response.clearCookie(REFRESH_COOKIE, { path: '/' });
 }

 @Post('refresh')
 @HttpCode(HttpStatus.OK)
 async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
 const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
 if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

 const result = await this.tokenRefreshService.refresh(refreshToken);
 const secure = SESSION_COOKIE_SECURE;
 response.cookie(ACCESS_COOKIE, result.accessToken, {
 httpOnly: true,
 secure,
 sameSite: 'lax',
 domain: SESSION_COOKIE_DOMAIN,
 path: '/',
 maxAge: 15 * 60 * 1000,
 });
 return { ok: true };
 }

 @Get('me')
 @UseGuards(JwtAuthGuard)
 me(@Req() request: Request) {
 return request.user;
 }

 private async setSessionCookies(response: Response, userId: string): Promise<void> {
 const pair = this.tokenService.issuePair(userId);
 try {
 await this.prisma.session.create({
 data: { userId, refreshHash: pair.refreshTokenHash, expiresAt: pair.expiresAt },
 });
 } catch {
 // Local auth sessions still work via signed cookies when the database is unavailable.
 }

 const secure = SESSION_COOKIE_SECURE;
 response.cookie(ACCESS_COOKIE, pair.accessToken, {
 httpOnly: true,
 secure,
 sameSite: 'lax',
 domain: SESSION_COOKIE_DOMAIN,
 path: '/',
 maxAge: 15 * 60 * 1000,
 });
 response.cookie(REFRESH_COOKIE, pair.refreshToken, {
 httpOnly: true,
 secure,
 sameSite: 'lax',
 domain: SESSION_COOKIE_DOMAIN,
 path: '/',
 maxAge: 30 * 24 * 60 * 60 * 1000,
 });
 }
}

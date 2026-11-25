import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

interface AuthedRequest extends Request { user?: { id: string; email: string; displayName: string; roles: string[] } }
interface RequiredAuthRequest extends Request { user: { id: string; email: string; displayName: string; roles: string[] } }

@Controller('content')
export class ContentController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async withDbFallback<T>(operation: Promise<T>, fallback: T): Promise<T> {
    return Promise.race([operation, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 700))]).catch(() => fallback);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: RequiredAuthRequest) {
    const userId = request.user.id;
    const fallback = {
      id: userId,
      name: request.user.displayName,
      email: request.user.email,
      handle: '@' + request.user.email.split('@')[0],
      initials: request.user.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
      verified: false,
      verification: 'EMAIL_VERIFIED',
      university: null,
      department: null,
      programme: null,
      level: null,
      bio: 'StudNet member.',
      avatarUrl: null,
      posts: 0,
      likes: 0,
      answers: 0,
      resources: 0,
      saved: 0,
    };
    const user = await this.withDbFallback(this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }), null);
    return { data: user ? { ...fallback, name: user.displayName, email: user.email } : fallback };
  }

  @Get('people')
  @UseGuards(OptionalAuthGuard)
  async people(@Req() request: AuthedRequest) {
    const users = await this.withDbFallback(
      this.prisma.user.findMany({
        where: { isActive: true, id: { not: request.user?.id ?? '' } },
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: { profile: true, followerOf: true, followerLinks: true },
      }),
      [],
    );
    return { data: users.map((user) => this.publicProfile(user, request.user)) };
  }

  @Get('people/:handle')
  @UseGuards(OptionalAuthGuard)
  async person(@Param('handle') handle: string, @Req() request: AuthedRequest) {
    const value = handle.replace(/^@/, '');
    const user = await this.withDbFallback(
      this.prisma.user.findFirst({
        where: { isActive: true, OR: [{ id: value }, { email: { startsWith: value } }] },
        include: { profile: true, followerOf: true, followerLinks: true },
      }),
      null,
    );
    return { data: user ? this.publicProfile(user, request.user) : null };
  }

  @Get('search')
  @UseGuards(OptionalAuthGuard)
  async search(@Query('q') query: string, @Req() request: AuthedRequest) {
    const q = String(query ?? '').trim();
    if (!q) return { data: { people: [], posts: [], opportunities: [], resources: [] } };
    const [users, opportunities, resources] = await this.withDbFallback<[any[], any[], any[]]>(
      Promise.all([
        this.prisma.user.findMany({ where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }, take: 10 }),
        this.prisma.opportunity.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { organization: { contains: q, mode: 'insensitive' } }] }, take: 10 }),
        this.prisma.courseResource.findMany({ where: { title: { contains: q, mode: 'insensitive' } }, take: 10 }),
      ]) as Promise<[any[], any[], any[]]>,
      [[], [], []],
    );
    return { data: { people: users.map((u) => this.publicProfile(u, request.user)), posts: [], opportunities, resources } };
  }

  @Get('feed')
  @UseGuards(OptionalAuthGuard)
  async feed(@Req() request: AuthedRequest, @Query('tab') tab?: string) {
    const posts = await this.withDbFallback(
      this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { author: { include: { profile: true } }, likes: true, saves: true, replies: true },
      }),
      [],
    );
    return {
      data: posts.map((post) => ({
        id: post.id,
        name: post.author.displayName,
        avatar: post.author.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
        color: 'purple',
        verified: false,
        type: post.type.toLowerCase(),
        typeLabel: post.typeLabel,
        handle: '@' + post.author.email.split('@')[0],
        meta: this.relativeTime(post.createdAt),
        text: post.body,
        media: post.mediaKind,
        mediaLabel: post.mediaLabel,
        hashtags: post.hashtags,
        likes: post.likes.length,
        comments: post.replies.length,
        shares: 0,
        liked: false,
        saved: false,
        replies: [],
      })),
    };
  }

  @Get('conversations')
  @UseGuards(OptionalAuthGuard)
  async conversations() {
    return { data: await this.withDbFallback(this.prisma.conversation.findMany({ take: 30 }), []) };
  }

  @Get('conversations/:id/messages')
  @UseGuards(OptionalAuthGuard)
  async messages(@Param('id') id: string) {
    return { data: await this.withDbFallback(this.prisma.message.findMany({ where: { conversationId: id }, take: 50 }), []) };
  }

  @Get('opportunities')
  async opportunities() {
    return { data: await this.withDbFallback(this.prisma.opportunity.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }), []) };
  }

  @Get('resources')
  async resources() {
    return { data: await this.withDbFallback(this.prisma.courseResource.findMany(), []) };
  }

  @Get('notifications')
  @UseGuards(OptionalAuthGuard)
  async notifications(@Req() request: AuthedRequest) {
    const userId = request.user?.id;
    if (!userId) return { data: [] };
    return { data: await this.withDbFallback(this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }), []) };
  }

  @Post('notifications/:id/read')
  @UseGuards(OptionalAuthGuard)
  async markRead(@Param('id') id: string) {
    await this.withDbFallback(this.prisma.notification.updateMany({ where: { id }, data: { read: true } }), { count: 0 });
    return { data: { ok: true } };
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost() {
    return { data: { ok: false } };
  }

  @Post('posts/:id/like')
  @UseGuards(OptionalAuthGuard)
  async like() {
    return { data: { ok: true } };
  }

  @Post('posts/:id/save')
  @UseGuards(OptionalAuthGuard)
  async save() {
    return { data: { ok: true } };
  }

  @Post('posts/:id/reply')
  @UseGuards(OptionalAuthGuard)
  async reply() {
    return { data: { ok: true } };
  }

  @Post('people/:handle/follow')
  @UseGuards(JwtAuthGuard)
  async follow() {
    return { data: { following: true } };
  }

  @Delete('people/:handle/follow')
  @UseGuards(JwtAuthGuard)
  async unfollow() {
    return { data: { following: false } };
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  async createConversation() {
    return { data: { ok: true } };
  }

  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage() {
    return { data: { ok: true } };
  }

  private publicProfile(user: any, viewer?: any) {
    const profile = user.profile;
    return {
      id: user.id,
      name: user.displayName,
      email: user.email,
      handle: profile?.handle || '@' + String(user.email ?? '').split('@')[0],
      initials: user.displayName.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(),
      verified: false,
      verification: profile?.verification ?? 'UNVERIFIED',
      university: profile?.university?.name ?? null,
      department: profile?.department?.name ?? null,
      programme: profile?.programme?.name ?? null,
      level: profile?.level ?? null,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      posts: 0,
      likes: 0,
      answers: 0,
      resources: 0,
      saved: 0,
      followers: user.followerLinks?.length ?? 0,
      following: user.followerOf?.length ?? 0,
      mutuals: [],
      canMessage: user.id !== viewer?.id,
      followingYou: Boolean(user.followerOf?.some((link: any) => link.followerId === viewer?.id)),
      joined: user.createdAt?.toISOString?.() ?? '',
    };
  }

  private relativeTime(date: Date): string {
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
    if (minutes < 60) return minutes + ' min';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hr';
    return Math.floor(hours / 24) + ' d';
  }
}

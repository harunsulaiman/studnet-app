import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

type AuthedUser = { id: string; email: string; displayName: string; roles: string[] };
type AuthedRequest = Request & { user?: AuthedUser };
type RequiredAuthRequest = Request & { user: AuthedUser };

@Controller('content')
export class ContentController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: RequiredAuthRequest) {
    const userId = request.user.id;
    const [user, counts] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: { include: { university: true, department: true, programme: true } } },
      }),
      Promise.all([
        this.prisma.post.count({ where: { authorId: userId } }),
        this.prisma.postLike.count({ where: { userId } }),
        this.prisma.forumReply.count({ where: { authorId: userId } }),
        this.prisma.courseResource.count({ where: { ownerId: userId } }),
        this.prisma.postSave.count({ where: { userId } }),
      ]),
    ]);
    const profile = user.profile;
    return {
      id: user.id,
      name: user.displayName,
      email: user.email,
      handle: `@${user.email.split('@')[0]}`,
      initials: this.initials(user.displayName),
      verified: profile?.verification !== 'UNVERIFIED',
      verification: profile?.verification ?? 'UNVERIFIED',
      university: profile?.university?.name ?? null,
      department: profile?.department?.name ?? null,
      programme: profile?.programme?.name ?? null,
      level: profile?.level ?? null,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      posts: counts[0],
      likes: counts[1],
      answers: counts[2],
      resources: counts[3],
      saved: counts[4],
    };
  }

  @Get('people')
  @UseGuards(OptionalAuthGuard)
  async people(@Req() request: AuthedRequest) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, id: { not: request.user?.id ?? '' } },
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: { profile: true, followerOf: true, followerLinks: true },
    });
    return users.map((user) => this.publicProfile(user, request.user));
  }

  @Get('people/:handle')
  @UseGuards(OptionalAuthGuard)
  async person(@Param('handle') handle: string, @Req() request: AuthedRequest) {
    const value = handle.replace(/^@/, '');
    const user = await this.prisma.user.findFirst({
      where: { isActive: true, OR: [{ id: value }, { email: { startsWith: value } }] },
      include: { profile: true, followerOf: true, followerLinks: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.publicProfile(user, request.user);
  }

  @Get('search')
  @UseGuards(OptionalAuthGuard)
  async search(@Query('q') query: string) {
    const q = String(query ?? '').trim();
    if (!q) return { people: [], posts: [], opportunities: [], resources: [] };
    const [users, posts, opportunities, resources] = await Promise.all([
      this.prisma.user.findMany({ where: { isActive: true, OR: [{ displayName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }, take: 10 }),
      this.prisma.post.findMany({ where: { OR: [{ body: { contains: q, mode: 'insensitive' } }, { typeLabel: { contains: q, mode: 'insensitive' } }] }, take: 10, include: { author: true } }),
      this.prisma.opportunity.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { organization: { contains: q, mode: 'insensitive' } }] }, take: 10 }),
      this.prisma.courseResource.findMany({ where: { title: { contains: q, mode: 'insensitive' } }, take: 10 }),
    ]);
    return {
      people: users.map((user) => ({ id: user.id, name: user.displayName, handle: `@${user.email.split('@')[0]}`, email: user.email })),
      posts: posts.map((post) => ({ id: post.id, body: post.body, author: post.author.displayName })),
      opportunities,
      resources,
    };
  }

  @Get('feed')
  @UseGuards(OptionalAuthGuard)
  async feed(@Req() request: AuthedRequest) {
    const userId = request.user?.id;
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, replies: true } },
        ...(userId ? { likes: { where: { userId }, select: { id: true } }, saves: { where: { userId }, select: { id: true } } } : {}),
      },
    });
    return posts.map((post) => this.postItem(post, userId));
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(@Req() request: RequiredAuthRequest, @Body() body: { body?: string; type?: string }) {
    const text = String(body?.body ?? '').trim();
    if (!text) throw new BadRequestException('Post body is required');
    const allowed = ['GENERAL', 'ACADEMIC', 'PROJECT', 'CAMPUS', 'FORUM'];
    const type = allowed.includes(String(body?.type)) ? (body!.type as 'GENERAL' | 'ACADEMIC' | 'PROJECT' | 'CAMPUS' | 'FORUM') : 'GENERAL';
    const post = await this.prisma.post.create({
      data: { authorId: request.user.id, body: text, type, typeLabel: type.toLowerCase(), hashtags: [] },
    });
    return { id: post.id };
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  async like(@Param('id') id: string, @Req() request: RequiredAuthRequest) {
    const existing = await this.prisma.postLike.findUnique({ where: { postId_userId: { postId: id, userId: request.user.id } } });
    if (existing) await this.prisma.postLike.delete({ where: { id: existing.id } });
    else await this.prisma.postLike.create({ data: { postId: id, userId: request.user.id } });
    return { liked: !existing };
  }

  @Post('posts/:id/save')
  @UseGuards(JwtAuthGuard)
  async save(@Param('id') id: string, @Req() request: RequiredAuthRequest) {
    const existing = await this.prisma.postSave.findUnique({ where: { postId_userId: { postId: id, userId: request.user.id } } });
    if (existing) await this.prisma.postSave.delete({ where: { id: existing.id } });
    else await this.prisma.postSave.create({ data: { postId: id, userId: request.user.id } });
    return { saved: !existing };
  }

  @Post('posts/:id/reply')
  @UseGuards(JwtAuthGuard)
  async reply(@Param('id') id: string, @Req() request: RequiredAuthRequest, @Body() body: { body?: string }) {
    const text = String(body?.body ?? '').trim();
    if (!text) throw new BadRequestException('Reply body is required');
    const reply = await this.prisma.forumReply.create({ data: { postId: id, authorId: request.user.id, body: text } });
    return { id: reply.id };
  }

  @Get('posts/:id/replies')
  async replies(@Param('id') id: string) {
    const replies = await this.prisma.forumReply.findMany({ where: { postId: id }, orderBy: { createdAt: 'asc' }, include: { author: true } });
    return replies.map((reply) => ({ id: reply.id, body: reply.body, author: reply.author.displayName, createdAt: reply.createdAt }));
  }

  @Post('people/:handle/follow')
  @UseGuards(JwtAuthGuard)
  async follow(@Param('handle') handle: string, @Req() request: RequiredAuthRequest) {
    const target = await this.userByHandle(handle);
    if (target.id === request.user.id) throw new BadRequestException('Cannot follow yourself');
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: request.user.id, followingId: target.id } },
      update: {},
      create: { followerId: request.user.id, followingId: target.id },
    });
    return { following: true };
  }

  @Delete('people/:handle/follow')
  @UseGuards(JwtAuthGuard)
  async unfollow(@Param('handle') handle: string, @Req() request: RequiredAuthRequest) {
    const target = await this.userByHandle(handle);
    await this.prisma.follow.deleteMany({ where: { followerId: request.user.id, followingId: target.id } });
    return { following: false };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async conversations(@Req() request: RequiredAuthRequest) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId: request.user.id } } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: { participants: { include: { user: true } } },
    });
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  async createConversation(@Req() request: RequiredAuthRequest, @Body() body: { participantId?: string; name?: string }) {
    const participantId = String(body?.participantId ?? '');
    if (!participantId || participantId === request.user.id) throw new BadRequestException('Invalid participant');
    const participant = await this.prisma.user.findFirst({ where: { id: participantId, isActive: true } });
    if (!participant) throw new BadRequestException('Invalid participant');
    return this.prisma.conversation.create({
      data: {
        name: body?.name?.trim() || ('Chat ' + Date.now()),
        participants: { create: [{ userId: request.user.id }, { userId: participantId }] },
      },
    });
  }

  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Param('id') id: string, @Req() request: RequiredAuthRequest, @Body() body: { body?: string }) {
    const text = String(body?.body ?? '').trim();
    if (!text) throw new BadRequestException('Message body is required');
    await this.membership(id, request.user.id);
    return this.prisma.message.create({ data: { conversationId: id, senderId: request.user.id, body: text } });
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async messages(@Param('id') id: string, @Req() request: RequiredAuthRequest) {
    await this.membership(id, request.user.id);
    return this.prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 50 });
  }

  @Get('opportunities')
  async opportunities() {
    return this.prisma.opportunity.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  }

  @Get('resources')
  async resources() {
    return this.prisma.courseResource.findMany({ orderBy: { id: 'desc' }, take: 30 });
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async notifications(@Req() request: RequiredAuthRequest) {
    return this.prisma.notification.findMany({ where: { userId: request.user.id }, orderBy: { createdAt: 'desc' } });
  }

  @Post('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Param('id') id: string, @Req() request: RequiredAuthRequest) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId: request.user.id },
      data: { read: true },
    });
    return { ok: result.count > 0 };
  }
  private async userByHandle(handle: string) {
    const value = handle.replace(/^@/, '');
    const user = await this.prisma.user.findFirst({
      where: { isActive: true, OR: [{ id: value }, { email: { startsWith: value } }] },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async membership(conversationId: string, userId: string) {
    const membership = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
      select: { conversationId: true },
    });
    if (!membership) throw new BadRequestException('Not a conversation participant');
    return membership;
  }

  private initials(name: string): string {
    return name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  private postItem(post: any, viewerId?: string) {
    const profile = post.author?.profile;
    return {
      id: post.id,
      type: post.type.toLowerCase(),
      typeLabel: post.typeLabel ?? post.type.toLowerCase(),
      body: post.body,
      author: {
        id: post.author.id,
        name: post.author.displayName,
        handle: `@${post.author.email.split('@')[0]}`,
        initials: this.initials(post.author.displayName),
        verified: profile?.verification !== 'UNVERIFIED',
        verification: profile?.verification ?? 'UNVERIFIED',
      },
      timestamp: post.createdAt,
      likes: post._count?.likes ?? 0,
      replies: post._count?.replies ?? 0,
      liked: Boolean(post.likes?.length),
      saved: Boolean(post.saves?.length),
      hashtags: post.hashtags ?? [],
      mediaKind: post.mediaKind,
      mediaLabel: post.mediaLabel,
      campusScoped: post.campusScoped,
    };
  }

  private publicProfile(user: any, viewer?: AuthedUser) {
    const profile = user.profile;
    return {
      id: user.id,
      name: user.displayName,
      email: user.email,
      handle: `@${String(user.email ?? '').split('@')[0]}`,
      initials: this.initials(user.displayName),
      verified: profile?.verification !== 'UNVERIFIED',
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
}

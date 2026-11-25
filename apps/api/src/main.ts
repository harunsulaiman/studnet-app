import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PrismaService } from './prisma/prisma.service';
import {
  API_ORIGIN,
  IS_PRODUCTION,
  JWT_ACCESS_SECRET,
  REDIS_URL,
  SENTRY_DSN,
  WEB_ORIGIN,
 SOCKET_REDIS_ADAPTER,
} from './common/config/env';

const origins = [WEB_ORIGIN, API_ORIGIN].filter(Boolean);

async function bootstrap(): Promise<void> {
  if (IS_PRODUCTION && !REDIS_URL) {
    throw new Error('REDIS_URL must be configured in production');
  }
  if (SENTRY_DSN) Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1 });

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser.default ?? cookieParser);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('api/v1');

  const httpServer = app.getHttpServer();
  const io = new SocketIOServer(httpServer, {
    cors: { origin: origins, credentials: true },
  });
  let pubClient: Redis | undefined;
let subClient: Redis | undefined;
if (REDIS_URL && SOCKET_REDIS_ADAPTER) {
  try {
    pubClient = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: null, connectTimeout: 3000, enableOfflineQueue: false });
    subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
  } catch (error) {
    pubClient?.disconnect();
    subClient?.disconnect();
    pubClient = undefined;
    subClient = undefined;
    console.error("Socket.IO Redis adapter unavailable; using single-instance adapter", error instanceof Error ? error.message : String(error));
  }
}
const prisma = app.get(PrismaService);
  const jwt = app.get(JwtService);
  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth as { accessToken?: string } | undefined)?.accessToken;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify<{ sub?: string; type?: string }>(token, {
        secret: JWT_ACCESS_SECRET,
      });
      if (payload.type !== 'access' || !payload.sub) return next(new Error('Unauthorized'));
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.isActive) return next(new Error('Unauthorized'));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('conversation:join', async (conversationId: string, ack?: (result: unknown) => void) => {
      try {
        if (typeof conversationId !== 'string') throw new Error('Invalid conversation');
        const membership = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId },
          select: { conversationId: true },
        });
        if (!membership) throw new Error('Forbidden');
        socket.join(`conversation:${conversationId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ error: 'Forbidden' });
      }
    });

    socket.on(
      'message:send',
      async (payload: { conversationId: string; body: string }, ack?: (result: unknown) => void) => {
        try {
          const body = payload?.body?.trim();
          if (!payload?.conversationId || !body) throw new Error('Invalid message');
          const membership = await prisma.conversationParticipant.findFirst({
            where: { conversationId: payload.conversationId, userId },
            select: { conversationId: true },
          });
          if (!membership) throw new Error('Forbidden');
          const message = await prisma.message.create({
            data: { conversationId: payload.conversationId, senderId: userId, body },
          });
          io.to(`conversation:${payload.conversationId}`).emit('message:new', message);
          ack?.(message);
        } catch (error) {
          Sentry.captureException(error);
          ack?.({ error: 'Message could not be sent' });
        }
      },
    );
  });

  const port = Number(process.env.PORT ?? 8080);


  await app.listen(port, '0.0.0.0');
  console.log(`API listening on ${port}`);
}

bootstrap().catch((error) => {
  Sentry.captureException(error);
  console.error('Fatal startup error', error);
  process.exit(1);
});
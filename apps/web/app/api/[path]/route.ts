import type { NextRequest } from 'next/server';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../../../../api/src/app.module';
import { AllExceptionsFilter } from '../../../../api/src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../../../../api/src/common/interceptors/logging.interceptor';
import { corsOrigins } from '../../../../api/src/common/config/cors';
import { createApiHandler, createResponseHelper } from './nest-adapter';

const textDecoder = new TextDecoder();

let appPromise: Promise<INestApplication> | undefined;

async function getApp(): Promise<INestApplication> {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
      app.setGlobalPrefix('api/v1');
      app.use(helmet());
      app.use(cookieParser());
      app.useGlobalFilters(new AllExceptionsFilter());
      app.useGlobalInterceptors(new LoggingInterceptor());
      app.enableCors({ origin: corsOrigins(), credentials: true });
      await app.init();
      return app;
    })();
  }
  return appPromise;
}

async function handle(request: NextRequest): Promise<Response> {
  const app = await getApp();
  const adapter = app.getHttpAdapter().getInstance();
  const apiRequest = createApiHandler(request);
  apiRequest.headers['x-forwarded-host'] ??= request.headers.get('host') ?? 'localhost:3000';
  apiRequest.headers['x-forwarded-proto'] ??= 'https';
  apiRequest.body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  let resolveResponse!: (value: Response) => void;
  let rejectResponse!: (reason: unknown) => void;
  const responsePromise = new Promise<Response>((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });

  const apiResponse = createResponseHelper();
  (apiResponse as unknown as { end: (payload?: string | Uint8Array) => void }).end = (payload) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(apiResponse.headers)) {
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else headers.append(name, value);
    }
    const body = payload === undefined || payload === null ? null : typeof payload === 'string' ? payload : textDecoder.decode(payload);
    resolveResponse(new Response(body, { status: apiResponse.statusCode, headers }));
  };

  void adapter(apiRequest as never, apiResponse as never).catch(rejectResponse);
  return responsePromise;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;

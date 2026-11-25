import { BadRequestException, Body, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_BUCKET, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL } from '../common/config/env';

type AuthedRequest = Request & { user: { id: string; email: string; displayName: string; roles: string[] } };

@Controller('uploads')
export class UploadsController {
  private readonly s3: S3Client | null = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      })
    : null;

  @Post('sign')
  @UseGuards(JwtAuthGuard)
  async sign(@Req() request: AuthedRequest, @Body() body: { contentType?: string }) {
    if (!this.s3 || !R2_BUCKET) throw new BadRequestException('Media storage is not configured');
    const contentType = body?.contentType ?? '';
    if (!/^image\/(png|jpeg|webp|gif)$/.test(contentType)) throw new BadRequestException('Unsupported content type');
    const key = `uploads/${request.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const url = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
    return { url, key, publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : undefined };
  }
}
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
 private readonly logger = new Logger(PrismaService.name);

 async onModuleDestroy(): Promise<void> {
  await this.$disconnect();
 }

 async ensureConnected(): Promise<void> {
  try {
   await this.$queryRaw`SELECT 1`;
  } catch (error) {
   this.logger.warn(`Database unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
 }
}

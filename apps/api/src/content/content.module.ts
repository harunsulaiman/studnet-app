import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';

@Module({
  imports: [AuthModule],
  controllers: [ContentController],
})
export class ContentModule {}

import { Module } from '@nestjs/common';
import { FounderService } from './founder.service';
import { FounderController } from './founder.controller';

@Module({
  controllers: [FounderController],
  providers: [FounderService],
  exports: [FounderService],
})
export class FounderModule {}

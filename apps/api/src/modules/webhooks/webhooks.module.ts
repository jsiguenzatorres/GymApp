import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { DatabaseModule } from '../database/database.module';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [DatabaseModule, CrmModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}

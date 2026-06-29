import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController, SubscriptionsAdminController } from './subscriptions.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SubscriptionsController, SubscriptionsAdminController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}

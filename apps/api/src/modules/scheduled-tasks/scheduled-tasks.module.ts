import { Module } from '@nestjs/common';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { ScheduledTasksController } from './scheduled-tasks.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { AddonsModule } from '../addons/addons.module';

@Module({
  imports: [DatabaseModule, AuthModule, NotificationsModule, NutritionModule, AddonsModule],
  controllers: [ScheduledTasksController],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}

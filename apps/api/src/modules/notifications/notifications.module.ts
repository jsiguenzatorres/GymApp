import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { NotificationListener } from './notification.listener';
import { NotificationController } from './notification.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationController],
  providers: [EmailService, NotificationService, NotificationListener],
  exports: [EmailService, NotificationService],
})
export class NotificationsModule {}

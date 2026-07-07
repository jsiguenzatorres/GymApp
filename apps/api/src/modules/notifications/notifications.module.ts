import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { NotificationListener } from './notification.listener';
import { NotificationController } from './notification.controller';
import { FcmService } from './fcm.service';
import { DatabaseModule } from '../database/database.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, ConfigModule, WhatsAppModule], // ConfigModule kept for EmailService
  controllers: [NotificationController],
  providers: [EmailService, NotificationService, NotificationListener, FcmService],
  exports: [EmailService, NotificationService, FcmService],
})
export class NotificationsModule {}

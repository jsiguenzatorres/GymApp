import { Module } from '@nestjs/common';
import { NotificationPrefsService } from './notification-prefs.service';
import { NotificationPrefsController } from './notification-prefs.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [NotificationPrefsController],
  providers: [NotificationPrefsService],
  exports: [NotificationPrefsService],
})
export class NotificationPrefsModule {}

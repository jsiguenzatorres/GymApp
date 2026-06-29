import { Module } from '@nestjs/common';
import { HealthDataService } from './health-data.service';
import { HealthDataController, HealthDataAdminController } from './health-data.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HealthDataController, HealthDataAdminController],
  providers: [HealthDataService],
  exports: [HealthDataService],
})
export class HealthDataModule {}

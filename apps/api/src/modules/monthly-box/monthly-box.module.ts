import { Module } from '@nestjs/common';
import { MonthlyBoxService } from './monthly-box.service';
import { MonthlyBoxController } from './monthly-box.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AddonsModule } from '../addons/addons.module';

@Module({
  imports: [DatabaseModule, AuthModule, AddonsModule],
  controllers: [MonthlyBoxController],
  providers: [MonthlyBoxService],
})
export class MonthlyBoxModule {}

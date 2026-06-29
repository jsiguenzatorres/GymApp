import { Module } from '@nestjs/common';
import { ProgressPdfService } from './progress-pdf.service';
import { ProgressPdfController } from './progress-pdf.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { NutritionModule } from '../nutrition/nutrition.module';

@Module({
  imports: [DatabaseModule, AuthModule, NutritionModule],
  controllers: [ProgressPdfController],
  providers: [ProgressPdfService],
})
export class ProgressPdfModule {}

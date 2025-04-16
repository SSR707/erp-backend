import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [StatisticsController],
  providers: [StatisticsService, PrismaService],
})
export class StatisticsModule {}

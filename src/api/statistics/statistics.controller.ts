import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AdminGuard } from 'src/common/guard/admin.guard';

@UseGuards(AdminGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.statisticsService.getDashboard()
  }
}

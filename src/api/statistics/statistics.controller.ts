import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AdminGuard } from 'src/common/guard/admin.guard';

@UseGuards(AdminGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  getDashboard(
    @Query('fullname') fullname: string,
    @Query('category') category: string,
  ) {
    return this.statisticsService.getDashboard(fullname, category);
  }
}

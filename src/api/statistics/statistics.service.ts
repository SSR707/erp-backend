import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/enum';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}
  async getDashboard(fullname: string, category: string) {
    const userCount = await this.prismaService.user.count({
      where: {
        role: category ? (category as UserRole) : undefined,
        full_name: fullname
          ? { contains: fullname, mode: 'insensitive' }
          : undefined,
      },
    });
    const users = await this.prismaService.user.findMany({
      where: {
        role: category ? (category as UserRole) : undefined,
        full_name: fullname
          ? { contains: fullname, mode: 'insensitive' }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const startOfLastMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1,
    ); // O‘tgan oyning boshidan
    const endOfLastMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0,
    ); // O‘tgan oyning oxirigacha

    const lastMonthIncome = await this.prismaService.paymentForStudent.findMany(
      {
        where: {
          created_at: {
            gte: startOfLastMonth,
            lt: endOfLastMonth,
          },
        },
        select: { sum: true },
      },
    );

    const totalLastMonthIncome = lastMonthIncome.reduce(
      (acc, payment) => acc + payment.sum,
      0,
    );

    // Hozirgi oy uchun summa
    // Hozirgi oyning boshlanishi va tugash sanalari
    const startOfCurrentMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const endOfCurrentMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    );

    const currentMonthIncome =
      await this.prismaService.paymentForStudent.findMany({
        where: {
          created_at: {
            gte: startOfCurrentMonth,
            lt: endOfCurrentMonth,
          },
        },
        select: { sum: true },
      });

    const totalCurrentMonthIncome = currentMonthIncome.reduce(
      (acc, payment) => acc + payment.sum,
      0,
    );

    // O‘tgan oyga nisbatan hozirgi oyning foizi
    const percentageChange =
      totalLastMonthIncome > 0
        ? ((totalCurrentMonthIncome - totalLastMonthIncome) /
            totalLastMonthIncome) *
          100
        : 0;

    //cost

    // O‘tgan oyda xarajatlar jami
    const lastMonthCost = await this.prismaService.paymentForTeacher.findMany({
      where: {
        created_at: {
          gte: startOfLastMonth,
          lt: endOfLastMonth,
        },
      },
      select: { sum: true },
    });

    const totalLastMonthCost = lastMonthCost.reduce(
      (acc, payment) => acc + payment.sum,
      0,
    );

    // Hozirgi oyda xarajatlar jami
    const currentMonthCost =
      await this.prismaService.paymentForTeacher.findMany({
        where: {
          created_at: {
            gte: startOfCurrentMonth,
            lt: endOfCurrentMonth,
          },
        },
        select: { sum: true },
      });

    const totalCurrentMonthCost = currentMonthCost.reduce(
      (acc, payment) => acc + payment.sum,
      0,
    );

    // O‘tgan oyga nisbatan hozirgi oy xarajatlaridagi foiz o‘zgarishi
    const percentageChangeCost =
      totalLastMonthCost > 0
        ? ((totalCurrentMonthCost - totalLastMonthCost) / totalLastMonthCost) *
          100
        : 0;

    //  student count
    const studentCount = await this.prismaService.user.count({
      where: { role: UserRole.STUDENT },
    });

    // student age in percentage

    const now = new Date();

    const getDateYearsAgo = (years: number): Date => {
      const date = new Date();
      date.setFullYear(now.getFullYear() - years);
      return date;
    };

    // 10–13
    const date10 = getDateYearsAgo(10);
    const date13 = getDateYearsAgo(13);
    const from10To13 = await this.prismaService.user.findMany({
      where: {
        data_of_birth: {
          gte: date13,
          lte: date10,
        },
      },
    });

    // 14–17
    const date14 = getDateYearsAgo(14);
    const date17 = getDateYearsAgo(17);
    const from14To17 = await this.prismaService.user.findMany({
      where: {
        data_of_birth: {
          gte: date17,
          lte: date14,
        },
      },
    });

    // 18–25
    const date18 = getDateYearsAgo(18);
    const date25 = getDateYearsAgo(25);
    const from18To25 = await this.prismaService.user.findMany({
      where: {
        data_of_birth: {
          gte: date25,
          lte: date18,
        },
      },
    });

    // 26–30
    const date26 = getDateYearsAgo(26);
    const date30 = getDateYearsAgo(30);
    const from26To30 = await this.prismaService.user.findMany({
      where: {
        data_of_birth: {
          gte: date30,
          lte: date26,
        },
      },
    });

    // 30 dan katta
    const olderThan30 = await this.prismaService.user.findMany({
      where: {
        data_of_birth: {
          lte: date30,
        },
      },
    });

    const count10to13 = from10To13.length;
    const count14to17 = from14To17.length;
    const count18to25 = from18To25.length;
    const count26to30 = from26To30.length;
    const countAbove30 = olderThan30.length;

    const percent = (count: number) =>
      ((count / studentCount) * 100).toFixed(1);

    const ageStats = {
      '10-13': parseFloat(percent(count10to13)),
      '14-17': parseFloat(percent(count14to17)),
      '18-25': parseFloat(percent(count18to25)),
      '26-30': parseFloat(percent(count26to30)),
      '30+': parseFloat(percent(countAbove30)),
    };

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: {
        userCount,
        users,
        income: {
          sum: totalCurrentMonthIncome,
          percent: percentageChange,
        },
        cost: {
          sum: totalCurrentMonthCost,
          percent: percentageChangeCost,
        },
        studentCount,
        ageStats,
      },
    };
  }
}

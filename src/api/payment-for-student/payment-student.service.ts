import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePaymentStudentDto } from './dto/create-payment-student.dto';
import { config } from 'src/config';
import { UpdatePaymentStudentDto } from './dto/update-payment-student.dto';

@Injectable()
export class PaymentStudentService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}
  async createPayment(createPaymentStudentDto: CreatePaymentStudentDto) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { user_id: createPaymentStudentDto.student_id },
    });
    if (!currentUser) {
      throw new NotFoundException('Student not found!');
    }
    const currentGroup = await this.prismaService.groups.findUnique({
      where: { group_id: createPaymentStudentDto.group_id },
    });
    if (!currentGroup) {
      throw new NotFoundException('Group not found!');
    }
    const newPayment = await this.prismaService.paymentForStudent.create({
      data: createPaymentStudentDto,
    });

    const keys = await this.redis.keys('student-payments:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.CREATED,
      message: 'success',
      data: newPayment,
    };
  }

  async findAllPayment(page: number, limit: number) {
    const paymentRedisKey = `student-payments:page:${page}:limit:${limit}`;
    const paymentDataRedis = await this.redis.get(paymentRedisKey);
    if (paymentDataRedis) {
      return paymentDataRedis;
    }
    const skip = (page - 1) * limit;

    const allPayments = await this.prismaService.paymentForStudent.findMany({
      skip,
      take: limit,
    });
    const totalCount = await this.prismaService.paymentForStudent.count();

    const response = {
      status: HttpStatus.OK,
      message: 'success',
      data: allPayments,
      meta: {
        totalCount,
        page,
        limit,
      },
    };

    // 🧊 Redisga saqlash
    await this.redis.set(
      paymentRedisKey,
      JSON.stringify(response),
      'EX',
      config.REDIS_EX_TIME,
    );

    return response;
  }

  async findOnePayment(id: string) {
    const payment = await this.prismaService.paymentForStudent.findUnique({
      where: { payment_id: id },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found!');
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: payment,
    };
  }

  async updatePayment(
    id: string,
    updatePaymentStudentDto: UpdatePaymentStudentDto,
  ) {
    await this.findOnePayment(id);
    const updatePayment = await this.prismaService.paymentForStudent.update({
      where: { payment_id: id },
      data: updatePaymentStudentDto,
    });
    const keys = await this.redis.keys('student-payments:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: updatePayment,
    };
  }

  async deletePayment(id: string) {
    await this.findOnePayment(id);
    const deletePayment = await this.prismaService.paymentForStudent.delete({
      where: { payment_id: id },
    });
    const keys = await this.redis.keys('student-payments:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: deletePayment,
    };
  }
}

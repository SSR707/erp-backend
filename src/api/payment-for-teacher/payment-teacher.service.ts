import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePaymentTeacherDto } from './dto/create-payment-teacher.dto';
import { UpdatePaymentTeacherDto } from './dto/update-payment-teacher.dto';
import { config } from 'src/config';

@Injectable()
export class PaymentTeacherService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async createPayment(createPaymentTeacherDto: CreatePaymentTeacherDto) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { user_id: createPaymentTeacherDto.teacher_id },
    });
    if (!currentUser) {
      throw new NotFoundException('Teacher not found!');
    }
    const newPayment = await this.prismaService.paymentForTeacher.create({
      data: createPaymentTeacherDto,
    });

    const keys = await this.redis.keys('teacher-payments:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.CREATED,
      message: 'success',
      data: newPayment,
    };
  }

  async findAllPayments(page: number, limit: number) {
    const cacheKey = `teacher-payments:page:${page}:limit:${limit}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    const allPayments = await this.prismaService.paymentForTeacher.findMany({
      skip,
      take: limit,
    });

    const totalCount = await this.prismaService.paymentForTeacher.count();

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

    await this.redis.set(
      cacheKey,
      JSON.stringify(response),
      'EX',
      config.REDIS_EX_TIME,
    );

    return response;
  }

  async findOnePayment(id: string) {
    const payment = await this.prismaService.paymentForTeacher.findUnique({
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
    updatePaymentTeacherDto: UpdatePaymentTeacherDto,
  ) {
    await this.findOnePayment(id);

    const updated = await this.prismaService.paymentForTeacher.update({
      where: { payment_id: id },
      data: updatePaymentTeacherDto,
    });

    const keys = await this.redis.keys('teacher-payments:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: updated,
    };
  }

  async deletePayment(id: string) {
    await this.findOnePayment(id);

    const deleted = await this.prismaService.paymentForTeacher.delete({
      where: { payment_id: id },
    });

    const keys = await this.redis.keys('teacher-payments:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: deleted,
    };
  }
}

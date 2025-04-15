import { Module } from '@nestjs/common';
import { PaymentTeacherService } from './payment-teacher.service';
import { PaymentTeacherController } from './payment-teacher.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [PaymentTeacherController],
  providers: [PaymentTeacherService, PrismaService],
})
export class PaymentTeacherModule {}

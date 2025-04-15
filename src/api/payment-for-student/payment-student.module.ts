import { Module } from '@nestjs/common';
import { PaymentStudentService } from './payment-student.service';
import { PaymentStudentController } from './payment-student.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [PaymentStudentController],
  providers: [PaymentStudentService, PrismaService],
})
export class PaymentStudentModule {}

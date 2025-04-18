import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { PaymentStudentService } from '../payment-for-student/payment-student.service';

@Module({
  controllers: [StudentController],
  providers: [
    StudentService,
    PrismaService,
    PaymentStudentService,
    GroupMembersService,
  ],
})
export class StudentModule {}

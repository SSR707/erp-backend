import { PartialType } from '@nestjs/swagger';
import { CreatePaymentStudentDto } from './create-payment-student.dto';

export class UpdatePaymentStudentDto extends PartialType(
  CreatePaymentStudentDto,
) {}

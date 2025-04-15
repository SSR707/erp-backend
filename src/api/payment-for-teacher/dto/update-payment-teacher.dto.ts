import { PartialType } from '@nestjs/swagger';
import { CreatePaymentTeacherDto } from './create-payment-teacher.dto';

export class UpdatePaymentTeacherDto extends PartialType(
  CreatePaymentTeacherDto,
) {}

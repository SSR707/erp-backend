import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentEnum } from '../../../common/enum/index';

export class CreatePaymentTeacherDto {
  @ApiProperty({ enum: PaymentEnum, description: 'Type of the payment' })
  @IsEnum(PaymentEnum, {
    message: 'type must be a valid PaymentType enum value (CASH, CREDIT_CARD)',
  })
  type: PaymentEnum;

  @ApiProperty({ example: 1500000, description: 'Amount of the payment in UZS' })
  @IsNumber({}, { message: 'sum must be a number' })
  sum: number;

  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the teacher (UUID)',
  })
  @IsUUID(undefined, { message: 'teacher_id must be a valid UUID' })
  teacher_id: string;
}

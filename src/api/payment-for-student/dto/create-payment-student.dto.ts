import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentEnum } from '../../../common/enum/index';

export class CreatePaymentStudentDto {
  @ApiProperty({ enum: PaymentEnum, description: 'Type of the payment' })
  @IsEnum(PaymentEnum, {
    message:
      'type must be a valid PaymentType enum value (CASH, CREDIT_CARD)',
  })
  type: PaymentEnum;

  @ApiProperty({ example: 100000, description: 'Amount of the payment in UZS' })
  @IsNumber()
  sum: number;

  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the student (UUID)',
  })
  @IsUUID(undefined, { message: 'student_id must be a valid UUID' })
  student_id: string;

  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the group (UUID)',
  })
  @IsUUID(undefined, { message: 'group_id must be a valid UUID' })
  group_id: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { IsPhoneNumber } from 'src/common/decorator';
import { PaymentEnum, UserGender } from 'src/common/enum';

export class CreateStudentDto {
  @ApiProperty({
    type: String,
    description: 'FullName of student',
    example: 'Jhon Doe',
  })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({
    type: String,
    description: 'Username of student',
    example: 'jhondoe007',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    type: String,
    description: 'Password of student',
    example: 'jhondoe007!A',
  })
  @IsStrongPassword()
  @IsOptional()
  password: string;

  @ApiProperty({
    type: String,
    description: 'Gender of student',
    example: 'MALE',
    enum: UserGender,
  })
  @IsEnum(UserGender)
  gender: UserGender;

  @ApiProperty({
    type: String,
    description: 'Address of student',
    example: 'Toshkent, Guliston ',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'group id',
    example: '1234567890abcdef',
    type: String,
  })
  @IsString()
  groupId: string;

  @ApiProperty({ enum: PaymentEnum, description: 'Type of the payment' })
  @IsEnum(PaymentEnum, {
    message: 'type must be a valid PaymentType enum value (CASH, CREDIT_CARD)',
  })
  paymentType: PaymentEnum;

  @ApiProperty({ type: Number, description: 'Debt sum', example: 1000 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  sum: number;

  @ApiProperty({
    type: String,
    description: 'PhoneNumber of student ',
    example: '+998995556656',
  })
  @IsPhoneNumber()
  @IsOptional()
  phone_number: string;

  @ApiProperty({
    type: String,
    description: 'Date of birth of student',
    example: '2005-05-15',
  })
  @IsDateString()
  data_of_birth: string | Date;
}

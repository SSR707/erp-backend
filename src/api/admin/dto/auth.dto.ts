import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsDateString,
  IsOptional,
  IsStrongPassword,
} from 'class-validator';

import { UserRole } from '@prisma/client';
import { UserGender } from 'src/common/enum';

export class RegisterDto {
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
    description: 'Date of birth of student',
    example: '2005-05-15',
  })
  @IsDateString()
  data_of_birth: string| Date;
  @ApiProperty({
    description: 'Foydalanuvchi roli',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class LoginDto {
  @ApiProperty({
    description: 'Foydalanuvchi nomi',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Parol',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class TokenResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;
}

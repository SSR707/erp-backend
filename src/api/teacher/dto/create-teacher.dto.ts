import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { UserGender } from 'src/common/enum';

export class CreateTeacherDto {
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
  data_of_birth: string;
}

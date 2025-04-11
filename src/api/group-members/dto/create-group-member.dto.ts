import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateGroupMemberDto {
  @ApiProperty({
    description: 'group id',
    example: '1234567890abcdef',
    type: String,
    required: true,
  })
  @IsString()
  groupId: string;

  @ApiProperty({
    description: 'user id',
    example: 'abcdef1234567890',
    type: String,
    required: true,
  })
  @IsString()
  userId: string;
}

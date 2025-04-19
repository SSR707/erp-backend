import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TeacherGuard } from 'src/common/guard/teacher.guard';
import { AdminGuard } from 'src/common/guard/admin.guard';
import { UserID } from 'src/common/decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Teacher Api')
@ApiBearerAuth()
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @ApiOperation({
    summary: 'Create Teacher ',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Teacher created',
    schema: {
      example: {
        status: HttpStatus.CREATED,
        message: 'CREATED',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'A user with this username already exists',
    schema: {
      example: {
        status: HttpStatus.BAD_REQUEST,
        message: 'A user with this username already exists',
      },
    },
  })
  @UseGuards(AdminGuard)
  @Post('createTeacher')
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @ApiOperation({
    summary: 'Get all Teacher ',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Teacher fetched successfully',
    schema: {
      example: {
        status: HttpStatus.OK,
        message: 'success',
        data: [
          {
            user_id: 'f6bb055d-8b0b-4503-b53b-67c1230993f7',
            full_name: 'Jhon Doe',
            username: 'jhondoe007',
            password:
              '$2b$10$D01/2P0O1TI5Jg4hRglByOEwavU3cfLcLAbimHCgIn1VUXo0ZKN4W',
            role: 'TEACHER',
            created_at: '2025-04-06T15:25:06.746Z',
            updated_at: '2025-04-06T15:25:06.746Z',
          },
        ],
      },
    },
  })
  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.teacherService.findAll(page, limit);
  }


  @ApiOperation({
    summary: 'Upload student image',
    description: 'Upload an image file for a specific student',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'image added successfully',
    schema: {
      example: {
        status_code: HttpStatus.CREATED,
        message: 'teacher image successfully created.',
        data: {
          image_url: '.png or jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Uuid Id cannot be parsed',
    schema: {
      example: {
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-image')
  uploadImga(@UploadedFile() file: Express.Multer.File) {
    return this.teacherService.imageUpload(file);
  }

  @ApiOperation({
    summary: 'clean Images',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher Images clean   successfully',
    schema: {
      example: {
        status: HttpStatus.OK,
        message: 'success',
      },
    },
  })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Delete('cleanUpUntrackedImages')
  cleanUpUntrackedImagesTeacher() {
    return this.teacherService.cleanUpUntrackedImagesTeacehr();
  }

  @ApiOperation({
    summary: 'Get Profile Teacher ',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile Teacher fetched successfully',
    schema: {
      example: {
        status: HttpStatus.OK,
        message: 'success',
        data: [
          {
            user_id: 'f6bb055d-8b0b-4503-b53b-67c1230993f7',
            full_name: 'Jhon Doe',
            username: 'jhondoe007',
          },
        ],
      },
    },
  })
  @UseGuards(TeacherGuard)
  @Get('getProfile')
  getProfile(@UserID() id: string) {
    return this.teacherService.getProfile(id);
  }

  @ApiOperation({
    summary: 'Get Teacher by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the Teacher',
    type: String,
    example: 'ws783241-213dsbzcxfdsh0329-ljdsk',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher fetched by id successfully',
    schema: {
      example: {
        status: HttpStatus.OK,
        message: 'success',
        data: {
          user_id: 'f6bb055d-8b0b-4503-b53b-67c1230993f7',
          full_name: 'Jhon Doe',
          username: 'jhondoe007',
          password:
            '$2b$10$D01/2P0O1TI5Jg4hRglByOEwavU3cfLcLAbimHCgIn1VUXo0ZKN4W',
          role: 'TEACHER',
          created_at: '2025-04-06T15:25:06.746Z',
          updated_at: '2025-04-06T15:25:06.746Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher Not Found',
    schema: {
      example: {
        status: HttpStatus.NOT_FOUND,
        message: 'Teacher with id 2378askjdh-23498sjkdafh not found.',
      },
    },
  })
  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(id);
  }

  @ApiOperation({
    summary: 'Edit Profile Teacher ',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Teacher Updated successfully',
    schema: {
      example: {
        status: HttpStatus.OK,
        message: 'success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher Not Found',
    schema: {
      example: {
        status: HttpStatus.NOT_FOUND,
        message: 'Teacher with id 2378askjdh-23498sjkdafh not found.',
      },
    },
  })
  @UseGuards(TeacherGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @ApiOperation({
    summary: 'Delete Teacher ',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Teacher delete successfully',
    schema: {
      example: {
        status: HttpStatus.OK,
        message: 'success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher Not Found',
    schema: {
      example: {
        status: HttpStatus.NOT_FOUND,
        message: 'Teacher with id 2378askjdh-23498sjkdafh not found.',
      },
    },
  })
  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherService.remove(id);
  }
}

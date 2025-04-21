import {
  Injectable,
  NotFoundException,
  HttpStatus,
  ConflictException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt/bcrypt';
import { Redis } from 'ioredis';
import { config } from 'src/config';
import { FileService } from 'src/infrastructure/lib';

@Injectable()
export class TeacherService {

  constructor(
    private readonly prismaService: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly fileService: FileService,
  ) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const currentTeacher = await this.prismaService.user.findUnique({
      where: { username: createTeacherDto.username },
    });
    if (currentTeacher) {
      throw new ConflictException('A user with this username already exists');
    }
    createTeacherDto.data_of_birth = new Date(createTeacherDto.data_of_birth);
    createTeacherDto.password = await BcryptEncryption.encrypt(
      createTeacherDto.password,
    );
    const teacher = await this.prismaService.user.create({
      data: { ...createTeacherDto, role: 'TEACHER' },
    });

    // teacher delete from redis
    const keys = await this.redis.keys('teachers:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.CREATED,
      message: 'created',
      data: teacher,
    };
  }

  async findAll(page: number, limit: number) {
    const key = `teachers:page:${page}:limit:${limit}`;
    const allTeacher = await this.redis.get(key);
    if (allTeacher) {
      return {
        status: HttpStatus.OK,
        message: 'success',
        data:JSON.parse(allTeacher)
      };

    }
    const skip = (page - 1) * limit;
    const teachers = await this.prismaService.user.findMany({
      where: { role: 'TEACHER' },
      include: {
        images: true,
      },
      take: limit,
      skip: skip,
    });
    await this.redis.set(key, JSON.stringify(teachers));
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: teachers,
    };
  }
  async getProfile(id: string) {
    const teacher = await this.prismaService.user.findUnique({
      where: { user_id: id, role: 'TEACHER' },
      select: { user_id: true, full_name: true, username: true, role: true },
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: teacher,
    };
  }

  async imageUpload(file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('file are required!');
    }
    try {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Only JPG, PNG and GIF files are allowed',
        );
      }
      const uploadFile = await this.fileService.uploadFile(file, 'teacher');

      if (!uploadFile || !uploadFile.path) {
        throw new BadRequestException('Failed to upload image');
      }

      const imageUrl = config.API_URL + '/' + uploadFile.path;

      return {
        status: HttpStatus.OK,
        message: 'success',
        data: {
          image_url: imageUrl,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to uploading image: ${error.message}`,
      );
    }
  }


  async cleanUpUntrackedImagesTeacehr() {
    const teacherImages = await this.prismaService.images.findMany({
      where: { user: { role: 'TEACHER' } },
    });

    const teacherImagesUrlArr = teacherImages.map((item) =>
      item.url.replace(config.API_URL + '/', ''),
    );
    const teacherAllFile = await this.fileService.getAllFiles('teacher');

    for (const filePath of teacherAllFile) {
      if (!teacherImagesUrlArr.includes(filePath)) {
        await this.fileService.deleteFile(filePath);
      }
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }


  async findOne(id: string) {
    const teacher = await this.prismaService.user.findUnique({
      where: { user_id: id, role: 'TEACHER' },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${id} not found.`);
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: teacher,
    };
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const currentTeacher = await this.prismaService.user.findUnique({
      where: { user_id: id },
    });
    if (!currentTeacher) {
      throw new NotFoundException(`Teacher with id ${id} not found.`);
    }
    await this.prismaService.user.update({
      where: { user_id: id },
      data: { full_name: updateTeacherDto.full_name },
    });
    // teacher delete from redis
    const keys = await this.redis.keys('teachers:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

  async remove(id: string) {
    const currentTeacher = await this.prismaService.user.findUnique({
      where: { user_id: id },
    });
    if (!currentTeacher) {
      throw new NotFoundException(`Teacher with id ${id} not found.`);
    }
    // teacher delete from redis
    const keys = await this.redis.keys('teachers:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }
    await this.prismaService.user.delete({ where: { user_id: id } });
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

}

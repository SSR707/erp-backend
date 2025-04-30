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
import { UserGender, UserRole } from 'src/common/enum';

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
    const { img_url, ...newTeacherDto } = createTeacherDto;

    const teacher = await this.prismaService.user.create({
      data: { ...newTeacherDto, role: 'TEACHER' },
    });

    if (createTeacherDto.img_url) {
      await this.prismaService.images.create({
        data: { is_worked: true, url: img_url, user_id: teacher.user_id },
      });
    }

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

  async forGroup() {
    const teachers = await this.prismaService.user.findMany({
      where: { role: UserRole.TEACHER },
      include: { images: true },
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: teachers,
    };
  }

  async findAll(
    page: number,
    limit: number,
    date_of_birth?: string,
    gender?: UserGender,
    full_name?: string,
  ) {
    const key = `teachers:page:${page}:limit:${limit}:full_name${full_name}:gender:${gender}:date_of_birth:${date_of_birth}`;
    const allTeacher = await this.redis.get(key);
    if (allTeacher) {
      return JSON.parse(allTeacher);
    }
    const skip = (page - 1) * limit;
    const dateFormat = new Date(date_of_birth);
    const teachers = await this.prismaService.user.findMany({
      where: {
        role: UserRole.TEACHER,
        ...(gender && { gender }),
        ...(date_of_birth && {
          data_of_birth: { equals: dateFormat }, // <-- corrected here
        }),
        ...(full_name && {
          full_name: {
            contains: full_name,
            mode: 'insensitive',
          },
        }),
      },
      include: {
        images: true,
      },
      take: limit,
      skip: skip,
    });
    const teacherCount = await this.prismaService.user.count({
      where: {
        role: UserRole.TEACHER,
        ...(gender && { gender }),
        ...(date_of_birth && {
          data_of_birth: { equals: dateFormat }, // <-- corrected here
        }),
        ...(full_name && {
          full_name: {
            contains: full_name,
            mode: 'insensitive',
          },
        }),
      },
    });
    await this.redis.set(
      key,
      JSON.stringify({
        status: HttpStatus.OK,
        message: 'success',
        data: teachers,
        meta: {
          teacherCount,
        },
      }),
    );
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: teachers,
      meta: {
        teacherCount,
      },
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
      include: { images: true, groups: true, PaymentForTeacher: true },
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
      include: {
        PaymentForTeacher: true,
      },
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

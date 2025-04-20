import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Redis } from 'ioredis';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt/bcrypt';
import { GroupMembersService } from '../group-members/group-members.service';
import { PaymentStudentService } from '../payment-for-student/payment-student.service';
import { config } from 'src/config';
import { FileService } from 'src/infrastructure/lib';

@Injectable()
export class StudentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly groupMembersService: GroupMembersService,
    private readonly paymentStudentService: PaymentStudentService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly fileService: FileService,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const currentStudent = await this.prismaService.user.findUnique({
      where: { username: createStudentDto.username },
    });
    if (currentStudent) {
      throw new ConflictException('A user with this username already exists');
    }

    createStudentDto.data_of_birth = new Date(createStudentDto.data_of_birth);
    createStudentDto.password = await BcryptEncryption.hashPassword(
      createStudentDto.password,
    );

    const studentDto = {
      full_name: createStudentDto.full_name,
      username: createStudentDto.username,
      password: createStudentDto.password,
      address: createStudentDto.address,
      phone_number: createStudentDto.phone_number,
      gender: createStudentDto.gender,
      data_of_birth: createStudentDto.data_of_birth,
    };
    const student = await this.prismaService.user.create({
      data: { ...studentDto, role: 'STUDENT' },
    });
    await this.prismaService.images.create({
      data: {
        url: createStudentDto.img_url,
        is_worked: true,
        user_id: student.user_id,
      },
    });
    const keys = await this.redis.keys('students:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }
    const group = await this.groupMembersService.create({
      groupId: createStudentDto.groupId,
      userId: student.user_id,
    });
    await this.paymentStudentService.createPayment({
      type: createStudentDto.paymentType,
      sum: createStudentDto.sum,
      student_id: student.user_id,
      group_id: group.data.group_id,
    });
    return {
      status: HttpStatus.CREATED,
      message: 'created',
      data: student,
    };
  }

  async findAll(page: number, limit: number) {
    const redisKey = `students:page:${page}:limit:${limit}`;
    const cachedStudents = await this.redis.get(redisKey);
    if (cachedStudents) {
      return JSON.parse(cachedStudents);
    }

    const skip = (page - 1) * limit;
    const students = await this.prismaService.user.findMany({
      where: { role: 'STUDENT' },
      skip,
      take: limit,
      include: {
        group_members: {
          include: { group: { select: { name: true, group_id: true } } },
        },
        images: {
          select: {
            url: true,
          },
        },
      },
    });

    const studentCount = await this.prismaService.user.count({
      where: { role: 'STUDENT' },
    });

    await this.redis.set(
      redisKey,
      JSON.stringify({
        status: HttpStatus.OK,
        message: 'success',
        data: students,
        meta: {
          studentCount,
        },
      }),
    );

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: students,
      meta: {
        studentCount,
      },
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
      const uploadFile = await this.fileService.uploadFile(file, 'student');

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

  async cleanUpUntrackedImagesStudent() {
    const studentImages = await this.prismaService.images.findMany({
      where: { user: { role: 'STUDENT' } },
    });

    const studentImagesUrlArr = studentImages.map((item) =>
      item.url.replace(config.API_URL + '/', ''),
    );
    const studentAllFile = await this.fileService.getAllFiles('student');

    for (const filePath of studentAllFile) {
      if (!studentImagesUrlArr.includes(filePath)) {
        await this.fileService.deleteFile(filePath);
      }
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

  async getProfile(id: string) {
    const student = await this.prismaService.user.findUnique({
      where: { user_id: id, role: 'STUDENT' },
      select: { user_id: true, full_name: true, username: true, role: true },
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: student,
    };
  }

  async findOne(id: string) {
    const student = await this.prismaService.user.findUnique({
      where: { user_id: id },
    });
    if (!student) {
      throw new NotFoundException(`Student with id ${id} not found.`);
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: student,
    };
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const currentStudent = await this.prismaService.user.findUnique({
      where: { user_id: id },
    });
    if (!currentStudent) {
      throw new NotFoundException(`Student with id ${id} not found.`);
    }

    await this.prismaService.user.update({
      where: { user_id: id },
      data: { full_name: updateStudentDto.full_name },
    });

    // Redisni tozalash
    const keys = await this.redis.keys('students:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

  async remove(id: string) {
    const currentStudent = await this.prismaService.user.findUnique({
      where: { user_id: id },
    });
    if (!currentStudent) {
      throw new NotFoundException(`Student with id ${id} not found.`);
    }

    await this.prismaService.user.delete({ where: { user_id: id } });

    // Redisni tozalash
    const keys = await this.redis.keys('students:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }
}

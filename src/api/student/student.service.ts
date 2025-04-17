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
import { config } from 'src/config';
import { Redis } from 'ioredis';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt/bcrypt';

@Injectable()
export class StudentService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
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

    const student = await this.prismaService.user.create({
      data: { ...createStudentDto, role: 'STUDENT' },
    });

    // Redisni tozalash (pagination keshlarini)
    const keys = await this.redis.keys('students:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

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
    });

    await this.redis.set(
      redisKey,
      JSON.stringify({
        status: HttpStatus.OK,
        message: 'success',
        data: students,
      }),
    );

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: students,
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

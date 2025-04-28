import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create.group.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AlreadyExistsException } from 'src/common/exceptions/already-exists.exception';
import { UpdateGroupDto } from './dto/update.group.dto';
import Redis from 'ioredis';
import { config } from 'src/config';
import { Prisma } from '@prisma/client';
import { GroupStatus } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private transformCreateDtoToPrisma(
    createGroupDto: CreateGroupDto,
  ): Prisma.GroupsCreateInput {
    return {
      name: createGroupDto.name,
      description: createGroupDto.description,
      start_date: new Date(createGroupDto.start_date),
      status: createGroupDto.status as GroupStatus,
      course: {
        connect: {
          course_id: createGroupDto.course_id,
        },
      },
      teacher: {
        connect: {
          user_id: createGroupDto.teacher_id,
        },
      },
    };
  }

  private transformUpdateDtoToPrisma(
    updateGroupDto: UpdateGroupDto,
  ): Prisma.GroupsUpdateInput {
    const updateData: Prisma.GroupsUpdateInput = {};
    if (updateGroupDto.name) updateData.name = updateGroupDto.name;
    if (updateGroupDto.description)
      updateData.description = updateGroupDto.description;
    if (updateGroupDto.status)
      updateData.status = updateGroupDto.status as GroupStatus;
    if (updateGroupDto.course_id) {
      updateData.course = {
        connect: {
          course_id: updateGroupDto.course_id,
        },
      };
    }
    if (updateGroupDto.teacher_id) {
      updateData.teacher = {
        connect: {
          user_id: updateGroupDto.teacher_id,
        },
      };
    }
    return updateData;
  }

  async createGroup(createGroupDto: CreateGroupDto) {
    const isBeenGroup = await this.prismaService.groups.findFirst({
      where: { name: createGroupDto.name },
    });
    if (isBeenGroup) {
      throw new AlreadyExistsException('Group with this name already exists');
    }

    // Verify that the course exists
    const course = await this.prismaService.course.findUnique({
      where: { course_id: createGroupDto.course_id },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const prismaData = this.transformCreateDtoToPrisma(createGroupDto);
    const newGroup = await this.prismaService.groups.create({
      data: prismaData,
    });

    const keys = await this.redis.keys('groups:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.CREATED,
      message: 'New group created',
      data: newGroup,
    };
  }

  async findAllGroup(
    page: number,
    limit: number,
    startDate: string,
    status: GroupStatus,
    name: string,
  ) {
    const redisKey = `groups:page:${page}:limit:${limit}:startDate${startDate}:status:${status}:name:${name}`;
    const cachedGroup = await this.redis.get(redisKey);

    if (cachedGroup) {
      return JSON.parse(cachedGroup);
    }

    const skip = (page - 1) * limit;

    // 🟡 Guruhlar ro'yxati, startDate, status
    const allGroups = await this.prismaService.groups.findMany({
      skip,
      take: limit,
      include: {
        course: true,
        teacher: true,
        group_members: { include: { user: true } },
      },
      where: {
        ...(startDate && {
          start_date: {
            equals: new Date(startDate),
          },
        }),
        ...(status && { status }),
        ...(name && { name }),
      },
    });

    // 🟢 Jami guruhlar soni
    const totalCount = await this.prismaService.groups.count();

    // 🟡 Faqat student bo'lgan group_members ni ajratib olish
    const groupsWithStudents = allGroups.map((group) => {
      const students = group.group_members.filter(
        (member) => member.user.role === 'STUDENT',
      );
      return {
        ...group,
        group_members: students,
      };
    });

    const response = {
      status: HttpStatus.OK,
      message: 'success',
      data: groupsWithStudents,
      meta: {
        totalCount, // ➕ jami guruhlar soni
        page,
        limit,
      },
    };

    // 🧊 Redisga saqlash
    await this.redis.set(
      redisKey,
      JSON.stringify(response),
      'EX',
      config.REDIS_EX_TIME,
    );

    return response;
  }

  async findOneGroup(groupId: string) {
    const group = await this.prismaService.groups.findFirst({
      where: { group_id: groupId },
      include: {
        course: true,
        teacher: true,
        group_members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found!');
    }

    const students = group.group_members.filter(
      (member) => member.user.role === 'STUDENT',
    );

    const groupWithStudents = {
      ...group,
      group_members: students,
    };

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: groupWithStudents,
    };
  }

  async updateGroup(groupId: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.prismaService.groups.findUnique({
      where: { group_id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const prismaData = this.transformUpdateDtoToPrisma(updateGroupDto);
    const updatedGroup = await this.prismaService.groups.update({
      where: { group_id: groupId },
      data: prismaData,
    });

    // group delete from redis
    const keys = await this.redis.keys('groups:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.OK,
      message: 'Group updated successfully',
      data: updatedGroup,
    };
  }

  async remove(groupId: string) {
    const currentGroup = await this.prismaService.groups.findUnique({
      where: { group_id: groupId },
    });

    if (!currentGroup) {
      throw new NotFoundException('Group not found!');
    }
    const deletedUser = await this.prismaService.groups.delete({
      where: { group_id: groupId },
    });

    // group delete from redis
    const keys = await this.redis.keys('groups:page:*');
    if (keys.length) {
      await this.redis.del(...keys);
    }

    return {
      status: HttpStatus.OK,
      message: 'success',
      data: deletedUser,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SignInAdminDto } from './dto/signin-admin.dto';
import { BcryptEncryption } from 'src/infrastructure/lib/bcrypt/bcrypt';
import { CustomJwtService } from 'src/infrastructure/lib/custom-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AddMemberDto } from './dto/add-memberdto';
import { FileService } from 'src/infrastructure/lib';
import { config } from 'src/config';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwt: CustomJwtService,
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
  ) {}

  //! SIGNIN ADMIN
  async signin(signinAdminDto: SignInAdminDto) {
    const currentAdmin = await this.prismaService.user.findUnique({
      where: { username: signinAdminDto.username },
    });

    if (!currentAdmin) {
      throw new BadRequestException('Username or password invalid');
    }

    const isMatchPassword = await BcryptEncryption.compare(
      signinAdminDto.password,
      currentAdmin.password,
    );
    if (!isMatchPassword) {
      throw new BadRequestException('Username or password invalid');
    }
    const payload = {
      id: currentAdmin.user_id,
      sub: currentAdmin.username,
      role: currentAdmin.role,
    };
    const accessToken = await this.jwt.generateAccessToken(payload);
    const refreshToken = await this.jwt.generateRefreshToken(payload);
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: {
        accessToken,
        access_token_expire:
          this.configService.get<string>('ACCESS_TOKEN_TIME'),
        refreshToken,
        refresh_token_expire:
          this.configService.get<string>('REFRESH_TOKEN_TIME'),
      },
    };
  }
  //! CREATE ADMIN
  async create(createAdminDto: CreateAdminDto) {
    const currentAdmin = await this.prismaService.user.findUnique({
      where: { username: createAdminDto.username },
    });
    if (currentAdmin) {
      throw new ConflictException('A user with this username already exists');
    }
    createAdminDto.password = await BcryptEncryption.encrypt(
      createAdminDto.password,
    );
    const { image_url, ...AdminDto } = createAdminDto;
    AdminDto.data_of_birth = new Date(AdminDto.data_of_birth)
    const admin = await this.prismaService.user.create({
      data: {
        ...AdminDto,
        role: UserRole.ADMIN,
      },
    });
    await this.prismaService.images.create({
      data: { url: image_url, user_id: admin.user_id, is_worked: true },
    });
    return {
      status: HttpStatus.CREATED,
      message: 'created',
      data: admin,
    };
  }

  //! GET ADMIN PROFILE
  async getProfile(id: string) {
    const admin = await this.prismaService.user.findUnique({
      where: { user_id: id, role: 'ADMIN' },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        images: true,
      },
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: admin,
    };
  }

  //! ADD Member TO GROUP
  async addMemberToGroup(addMemberDto: AddMemberDto) {
    const currentMember = await this.prismaService.user.findUnique({
      where: {
        user_id: addMemberDto.user_id,
      },
    });
    if (!currentMember) {
      throw new NotFoundException(
        `Member with id ${addMemberDto.user_id} not found.`,
      );
    }
    const currentGroup = await this.prismaService.groups.findUnique({
      where: { group_id: addMemberDto.group_id },
    });
    if (!currentGroup) {
      throw new NotFoundException(
        `Group with id ${addMemberDto.group_id} not found.`,
      );
    }
    await this.prismaService.groupMembers.create({
      data: addMemberDto,
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

  //! Image Upload Admin
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
      const uploadFile = await this.fileService.uploadFile(file, 'admin');

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

  //! Clean UpUntrackedImagesAdmin
  async cleanUpUntrackedImagesAdmin() {
    const adminImages = await this.prismaService.images.findMany({
      where: { user: { role: 'ADMIN' } },
    });

    const adminImagesUrlArr = adminImages.map((item) =>
      item.url.replace(config.API_URL + '/', ''),
    );
    const adminAllFile = await this.fileService.getAllFiles('admin');

    for (const filePath of adminAllFile) {
      if (!adminImagesUrlArr.includes(filePath)) {
        await this.fileService.deleteFile(filePath);
      }
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

  //! FIND ALL ADMIN
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const admins = await this.prismaService.user.findMany({
      where: {
        role: 'ADMIN',
      },
      include: {
        images: true,
      },
      skip,
      take: limit,
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: admins,
    };
  }

  //!FIND ADMIN BY ID
  async findOne(id: string) {
    const admin = await this.prismaService.user.findUnique({
      where: {
        user_id: id,
        role: 'ADMIN',
      },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found.`);
    }
    return {
      status: HttpStatus.OK,
      message: 'success',
      data: admin,
    };
  }

  //! EDIT PROFILE ADMIN
  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const currentAdmin = await this.prismaService.user.findUnique({
      where: {
        user_id: id,
        role: 'ADMIN',
      },
    });
    if (!currentAdmin) {
      throw new NotFoundException(`Admin with id ${id} not found.`);
    }
    await this.prismaService.user.update({
      where: { user_id: id },
      data: { full_name: updateAdminDto.full_name },
    });
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }

  //! DELETE ADMIN BY ID
  async remove(id: string) {
    const currentAdmin = await this.prismaService.user.findUnique({
      where: {
        user_id: id,
        role: 'ADMIN',
      },
    });
    if (!currentAdmin) {
      throw new NotFoundException(`Admin with id ${id} not found.`);
    }
    await this.prismaService.user.delete({ where: { user_id: id } });
    return {
      status: HttpStatus.OK,
      message: 'success',
    };
  }
}

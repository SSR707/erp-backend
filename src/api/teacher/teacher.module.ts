import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FileModule } from 'src/infrastructure/lib';

@Module({
  imports: [FileModule],
  controllers: [TeacherController],
  providers: [TeacherService, PrismaService],
})
export class TeacherModule {}

import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePaymentStudentDto } from './dto/create-payment-student.dto';
import { AdminGuard } from 'src/common/guard/admin.guard';
import { PaymentStudentService } from './payment-student.service';
import { UpdatePaymentStudentDto } from './dto/update-payment-student.dto';

@UseGuards(AdminGuard)
@Controller('payment-student')
export class PaymentStudentController {
  constructor(private readonly paymentStudentService: PaymentStudentService) {}
  @Post()
  createPayment(@Body() createPaymentStudentDto: CreatePaymentStudentDto) {
    return this.paymentStudentService.createPayment(createPaymentStudentDto);
  }

  @Get()
  getAllPayment(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.paymentStudentService.findAllPayment(page, limit);
  }

  @Get(':id')
  getOnePayment(@Param('id') paymentId: string) {
    return this.paymentStudentService.findOnePayment(paymentId);
  }

  @Put(':id')
  updatePayment(
    @Param('id') paymentId: string,
    @Body() updatePaymentStudentDto: UpdatePaymentStudentDto,
  ) {
    return this.paymentStudentService.updatePayment(
      paymentId,
      updatePaymentStudentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') paymentId: string) {
    return this.paymentStudentService.deletePayment(paymentId);
  }
}

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
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentTeacherDto } from './dto/create-payment-teacher.dto';
import { UpdatePaymentTeacherDto } from './dto/update-payment-teacher.dto';
import { PaymentTeacherService } from './payment-teacher.service';
import { AdminGuard } from 'src/common/guard/admin.guard';

@ApiTags('Payment for Teachers')
@UseGuards(AdminGuard)
@Controller('payment-teacher')
export class PaymentTeacherController {
  constructor(private readonly paymentTeacherService: PaymentTeacherService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment record for a teacher' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  createPayment(@Body() createPaymentTeacherDto: CreatePaymentTeacherDto) {
    return this.paymentTeacherService.createPayment(createPaymentTeacherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teacher payments (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated payments list' })
  getAllPayment(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.paymentTeacherService.findAllPayments(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific teacher payment by ID' })
  @ApiResponse({ status: 200, description: 'Returns the payment record' })
  getOnePayment(@Param('id') paymentId: string) {
    return this.paymentTeacherService.findOnePayment(paymentId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a teacher payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  updatePayment(
    @Param('id') paymentId: string,
    @Body() updatePaymentTeacherDto: UpdatePaymentTeacherDto,
  ) {
    return this.paymentTeacherService.updatePayment(
      paymentId,
      updatePaymentTeacherDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a teacher payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  remove(@Param('id') paymentId: string) {
    return this.paymentTeacherService.deletePayment(paymentId);
  }
}

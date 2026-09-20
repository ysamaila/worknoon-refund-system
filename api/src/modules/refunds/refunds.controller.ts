import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { OverrideRefundDto } from './dto/override-refund.dto';
import { Decision } from '../../policy/types';

@ApiTags('Refunds')
@Controller('api/refunds')
export class RefundsController {
  constructor(
    @Inject(RefundsService) private readonly refundsService: RefundsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a refund request through the 9-stage pipeline',
    description:
      'Processes free-text customer request through prompt injection check, AI intent extraction, authoritative database lookup, deterministic policy evaluation, AI reply drafting, and consistency verification.',
  })
  @ApiResponse({
    status: 201,
    description: 'Refund evaluated and persisted with full rule and AI traces',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async createRefund(@Body() dto: CreateRefundDto) {
    return this.refundsService.processRefundRequest(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List refunds for the admin dashboard' })
  @ApiQuery({ name: 'decision', required: false, enum: ['APPROVED', 'DENIED', 'ESCALATED'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated list of refunds' })
  async listRefunds(
    @Query('decision') decision?: Decision,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.refundsService.listRefunds({
      decision,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full audit detail of a refund request by ID' })
  @ApiResponse({ status: 200, description: 'Complete refund record with segregated policy and AI traces' })
  @ApiResponse({ status: 404, description: 'Refund request not found' })
  async getRefundById(@Param('id') id: string) {
    return this.refundsService.getRefundById(id);
  }

  @Post(':id/override')
  @ApiOperation({
    summary: 'Human escalation override',
    description: 'Allows human support supervisors to manually approve or deny an escalated refund claim.',
  })
  @ApiResponse({ status: 200, description: 'Refund status updated and override audit appended' })
  @ApiResponse({ status: 400, description: 'Invalid override verdict or missing explanation' })
  @ApiResponse({ status: 404, description: 'Refund request not found' })
  async overrideRefund(
    @Param('id') id: string,
    @Body() dto: OverrideRefundDto,
  ) {
    return this.refundsService.overrideEscalation(id, dto);
  }
}

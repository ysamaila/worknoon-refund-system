import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@Controller('api/customers')
export class CustomersController {
  constructor(
    @Inject(CustomersService) private readonly customersService: CustomersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all customers for demo selector' })
  @ApiResponse({ status: 200, description: 'Array of customer accounts' })
  async listCustomers() {
    return this.customersService.listCustomers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by ID' })
  @ApiResponse({ status: 200, description: 'Customer details with orders' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomerById(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get order history for a customer' })
  @ApiResponse({ status: 200, description: 'List of customer orders with item details' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerOrders(@Param('id') id: string) {
    return this.customersService.getCustomerOrders(id);
  }
}

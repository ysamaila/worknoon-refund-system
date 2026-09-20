import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { orders: true, refundRequests: true } },
      },
    });
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: true },
          orderBy: { placedAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found.`);
    }

    return customer;
  }

  async getCustomerOrders(customerId: string) {
    // Verify customer exists
    await this.getCustomerById(customerId);

    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { placedAt: 'desc' },
    });
  }
}

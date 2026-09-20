import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL database successfully.');
    } catch (err: any) {
      this.logger.warn(`PostgreSQL connection not established on boot: ${err.message}. Database operations will retry upon request.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

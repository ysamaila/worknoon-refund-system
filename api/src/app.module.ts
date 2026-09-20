import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { CustomersModule } from './modules/customers/customers.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { HealthController } from './health.controller';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [ConfigModule, PrismaModule, AiModule, CustomersModule, RefundsModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

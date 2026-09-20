import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AiModule } from './ai/ai.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule, AiModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

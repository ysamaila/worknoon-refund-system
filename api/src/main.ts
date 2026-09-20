import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvService } from './config/env.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const envService = app.get(EnvService);

  // Configure CORS
  app.enableCors({
    origin: [envService.frontendUrl, 'http://localhost:3000'],
    credentials: true,
  });

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Worknoon Customer Support Refund API')
    .setDescription(
      'Deterministic policy engine and AI-assisted refund authorization platform REST API',
    )
    .setVersion('1.0')
    .addTag('Health', 'Service health & configuration diagnostics')
    .addTag('Refunds', 'Refund submission, processing & human override')
    .addTag('Customers', 'Customer profile & order history')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(envService.port);
  logger.log(`Server running on http://localhost:${envService.port}`);
  logger.log(`Swagger documentation available at http://localhost:${envService.port}/api/docs`);
}

bootstrap();

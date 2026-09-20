import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';

const logger = new Logger('SwaggerExport');

async function exportSwagger() {
  logger.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.create(AppModule, { abortOnError: false });

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

  // Validate that document has valid structure
  if (!document || !document.paths || Object.keys(document.paths).length === 0) {
    throw new Error('Generated Swagger document contains no paths or endpoints!');
  }

  const outputPath = path.resolve(process.cwd(), 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

  logger.log(`Successfully exported Swagger document to: ${outputPath}`);
  logger.log(`Documented endpoints: ${Object.keys(document.paths).join(', ')}`);

  await app.close();
  process.exit(0);
}

exportSwagger().catch((err) => {
  console.error('[SwaggerExport Error]:', err);
  process.exit(1);
});

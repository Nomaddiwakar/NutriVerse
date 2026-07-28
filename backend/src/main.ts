import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('BOOTSTRAP_SYSTEM');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  
  // Apply Global Filters and Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Apply Strict parameters verification pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`NutriVerse Production NestJS Engine online at http://localhost:${port}`);
}

bootstrap();

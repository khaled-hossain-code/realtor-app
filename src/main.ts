import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CustomHttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerMiddleware } from './common/middlewares/logger/logger.middleware';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Apply the custom exception filter globally
  // app.useGlobalFilters(new CustomHttpExceptionFilter());

  app.use(new LoggerMiddleware().use);

  const config = new DocumentBuilder()
    .setTitle('Realtor App')
    .setDescription('The realtor API description')
    .setVersion('1.0')
    .addTag('realtor')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();

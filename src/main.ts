import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { AppExceptionFilter } from '@/infra/filters';

async function bootstrap() {
  const PORT = process.env.PORT;
  const NODE_ENV = process.env.NODE_ENV;

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

  app.useGlobalFilters(new AppExceptionFilter());

  await app.listen(PORT ?? 8090, '0.0.0.0');

  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}! 🚀`);
}

bootstrap();

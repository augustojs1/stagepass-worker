import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { AppExceptionFilter } from '@/infra/filters';
import { configuration } from './infra/config/configuration';

async function bootstrap() {
  const PORT = process.env.PORT;
  const NODE_ENV = process.env.NODE_ENV;

  const app = await NestFactory.create(AppModule);

  const env_variables = configuration();

  const queues = [
    env_variables.rmq.queue_payment_succes,
    env_variables.rmq.queue_payment_failed,
    env_variables.rmq.queue_ticket_generate,
    env_variables.rmq.queue_email_send,
  ];

  for (const queue of queues) {
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [env_variables.rmq.url],
        queue: queue,
        noAck: false,
        queueOptions: {
          durable: true,
        },
      },
    });
  }

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

  await app.startAllMicroservices();
  await app.listen(PORT);

  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}! 🚀`);
}

bootstrap();

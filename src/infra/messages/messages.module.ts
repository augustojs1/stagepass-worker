import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PaymentMessageRabbitMqConsumer } from './consumers/impl/rabbit-mq/payment-message-rabbitmq.consumer';
import { PaymentOrdersModule } from '@/modules/payment-orders/payment-orders.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { EventTicketReservationsModule } from '@/modules/event-ticket-reservations/event-ticket-reservations.module';
import { EventTicketsModule } from '@/modules/event-tickets/event-tickets.module';
import { PaymentGatewayModule } from '../payment-gateway/payment-gateway.module';
import { TicketsModule } from '@/modules/tickets/tickets.module';
import { configuration } from '../config/configuration';
import { ITicketsMessageProducer } from './producers/tickets/interfaces/message-producer.interface';
import { TicketsMessageRabbitMqProducer } from './producers/tickets/impl/tickets-message-rabbitmq.producer';
import { TicketsMessageRabbitMqConsumer } from './consumers/tickets/impl/rabbit-mq/tickets-message-rabbitmq.consumer';

const env_variables = configuration();

@Module({
  controllers: [PaymentMessageRabbitMqConsumer, TicketsMessageRabbitMqConsumer],
  providers: [
    {
      provide: ITicketsMessageProducer,
      useClass: TicketsMessageRabbitMqProducer,
    },
  ],
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'ticket_queue',
        transport: Transport.RMQ,
        options: {
          urls: [env_variables.rmq.url],
          queue: env_variables.rmq.queue_ticket_generate,
          queueOptions: {
            durable: true,
          },
          prefetchCount: 10,
        },
      },
    ]),
    PaymentOrdersModule,
    OrdersModule,
    EventTicketReservationsModule,
    EventTicketsModule,
    PaymentGatewayModule,
    TicketsModule,
  ],
  exports: [ITicketsMessageProducer],
})
export class MessagesModule {}

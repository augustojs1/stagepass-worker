import { Module } from '@nestjs/common';

import { PaymentMessageRabbitMqConsumer } from './consumers/impl/rabbit-mq/payment-message-rabbitmq.consumer';
import { PaymentOrdersModule } from '@/modules/payment-orders/payment-orders.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { EventTicketReservationsModule } from '@/modules/event-ticket-reservations/event-ticket-reservations.module';
import { EventTicketsModule } from '@/modules/event-tickets/event-tickets.module';
import { PaymentGatewayModule } from '../payment-gateway/payment-gateway.module';

@Module({
  controllers: [PaymentMessageRabbitMqConsumer],
  providers: [],
  imports: [
    PaymentOrdersModule,
    OrdersModule,
    EventTicketReservationsModule,
    EventTicketsModule,
    PaymentGatewayModule,
  ],
})
export class MessagesModule {}

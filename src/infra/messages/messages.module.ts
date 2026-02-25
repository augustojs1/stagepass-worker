import { Module } from '@nestjs/common';

import { PaymentMessageRabbitMqConsumer } from './consumers/impl/rabbit-mq/payment-message-rabbitmq.consumer';
import { PaymentOrdersModule } from '@/modules/payment-orders/payment-orders.module';

@Module({
  controllers: [PaymentMessageRabbitMqConsumer],
  imports: [PaymentOrdersModule],
  providers: [],
})
export class MessagesModule {}

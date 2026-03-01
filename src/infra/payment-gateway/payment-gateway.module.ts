import { Module } from '@nestjs/common';

import { PaymentGatewayWebhookEventsRepository } from './payment-gateway-webhook-events.repository';

@Module({
  controllers: [PaymentGatewayWebhookEventsRepository],
  providers: [],
  exports: [PaymentGatewayWebhookEventsRepository],
})
export class PaymentGatewayModule {}

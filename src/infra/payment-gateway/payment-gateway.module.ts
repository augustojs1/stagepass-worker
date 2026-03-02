import { Module } from '@nestjs/common';

import { PaymentGatewayWebhookEventsRepository } from './payment-gateway-webhook-events.repository';

@Module({
  controllers: [],
  providers: [PaymentGatewayWebhookEventsRepository],
  exports: [PaymentGatewayWebhookEventsRepository],
})
export class PaymentGatewayModule {}

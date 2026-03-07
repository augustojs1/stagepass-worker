import { Module } from '@nestjs/common';

import { PaymentGatewayWebhookEventsRepository } from './payment-gateway-webhook-events.repository';

@Module({
  providers: [PaymentGatewayWebhookEventsRepository],
  exports: [PaymentGatewayWebhookEventsRepository],
})
export class PaymentGatewayModule {}

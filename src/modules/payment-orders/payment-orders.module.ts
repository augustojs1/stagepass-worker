import { Module } from '@nestjs/common';

import { PaymentOrdersService } from './payment-orders.service';
import { PaymentOrdersRepository } from './payment-orders.repository';

@Module({
  providers: [PaymentOrdersService, PaymentOrdersRepository],
  exports: [PaymentOrdersService],
})
export class PaymentOrdersModule {}

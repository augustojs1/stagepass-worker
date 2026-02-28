import { Injectable, Logger } from '@nestjs/common';

import { PaymentOrdersRepository } from './payment-orders.repository';
import { PaymentOrderEntity } from './models/payment-order-entity.model';

@Injectable()
export class PaymentOrdersService {
  private readonly logger: Logger = new Logger(PaymentOrdersService.name);

  constructor(
    private readonly paymentOrdersRepository: PaymentOrdersRepository,
  ) {}

  async updateByProviderReferenceId(
    data: Partial<PaymentOrderEntity>,
  ): Promise<void> {
    try {
      await this.paymentOrdersRepository.updateByProviderReferenceId(data);

      this.logger.log(`Updated payment_order for order=${data.order_id}`);
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed updated payment_order for order=${data.order_id}`,
        e?.stack,
      );
    }
  }
}

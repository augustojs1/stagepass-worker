import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { MessageQueues } from '../../enums';
import { IPaymentEventsConsumer } from '../../payment/interfaces/ipayments-events.consumer';
import { PaymentFailedPayload } from '../../models';
import { PaymentOrdersService } from '@/modules/payment-orders/payment-orders.service';

@Controller()
export class PaymentMessageRabbitMqConsumer implements IPaymentEventsConsumer {
  private readonly logger = new Logger(PaymentMessageRabbitMqConsumer.name);

  constructor(private readonly paymentOrderService: PaymentOrdersService) {}

  @EventPattern(MessageQueues.PAYMENT_FAILED)
  async handleFailed(
    @Payload() payload: PaymentFailedPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    try {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();

      this.logger.log(
        `Receveid message on queue ${MessageQueues.PAYMENT_FAILED}`,
        payload,
      );

      await this.paymentOrderService.update({
        status: 'FAILED',
        ...payload,
      });

      channel.ack(originalMessage);
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.PAYMENT_FAILED} for order=${payload.order_id}`,
        e?.stack,
      );
    }
  }

  @EventPattern(MessageQueues.PAYMENT_SUCESS)
  async handleSucces(data: any): Promise<void> {
    console.log('handleSucces.:', data);
  }
}

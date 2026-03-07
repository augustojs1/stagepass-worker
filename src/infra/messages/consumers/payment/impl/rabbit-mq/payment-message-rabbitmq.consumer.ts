import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { MessageQueues } from '../../../enums';
import { IPaymentEventsConsumer } from '../../interfaces/ipayments-message.consumer';
import { PaymentFailedPayload } from '../../../models';
import { SuccessPaymentEventPayload } from '../../../models/success-payment-event-payload.model';
import { DATABASE_TAG } from '@/infra/database/orm/drizzle/drizzle.module';
import { ITicketsMessageProducer } from '@/infra/messages/producers/tickets/interfaces/message-producer.interface';
import { PaymentOrdersService } from '@/modules/payment-orders/payment-orders.service';

@Controller()
export class PaymentMessageRabbitMqConsumer implements IPaymentEventsConsumer {
  private readonly logger = new Logger(PaymentMessageRabbitMqConsumer.name);

  constructor(
    @Inject(DATABASE_TAG)
    private readonly paymentOrderService: PaymentOrdersService,
    private readonly ticketsMessageProducer: ITicketsMessageProducer,
  ) {}

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

      await this.paymentOrderService.handleFailedPaymentOrder(payload);

      this.logger.log(
        `Successfully processed message on queue ${MessageQueues.PAYMENT_FAILED} for order_id=${payload.order_id}, provider_reference_id=${payload.provider_reference_id}`,
        payload,
      );

      channel.ack(originalMessage);
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.PAYMENT_FAILED} for order_id=${payload.order_id}, provider_reference_id=${payload.provider_reference_id}`,
        e?.stack,
      );
    }
  }

  @EventPattern(MessageQueues.PAYMENT_SUCESS)
  async handleSucces(
    @Payload() payload: SuccessPaymentEventPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    try {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();

      this.logger.log(
        `Receveid message on queue ${MessageQueues.PAYMENT_SUCESS}`,
        payload,
      );

      await this.paymentOrderService.handleSuccessPaymentOrder(payload);

      channel.ack(originalMessage);

      this.logger.log(
        `Successfuly processed payment for order_id=${payload.order_id}`,
      );

      this.ticketsMessageProducer.emit(payload.order_id);
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.PAYMENT_SUCESS} for order_id=${payload.order_id}, provider_reference_id=${payload.provider_reference_id}`,
        e?.stack,
      );
    }
  }
}

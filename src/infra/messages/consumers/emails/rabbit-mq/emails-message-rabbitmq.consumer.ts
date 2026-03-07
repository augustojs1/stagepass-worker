import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { IEmailsEventsConsumer } from '../interfaces/iemails-events.consumer';
import { MessageQueues } from '../../enums';

@Controller()
export class EmailsMessageRabbitMqConsumer implements IEmailsEventsConsumer {
  private readonly logger = new Logger(EmailsMessageRabbitMqConsumer.name);

  @EventPattern(MessageQueues.EMAIL)
  async handle(
    @Payload() payload: { order_id: string },
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received message on queue ${MessageQueues.EMAIL} for order_id=${payload.order_id}`,
      payload,
    );

    try {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();

      channel.ack(originalMessage);
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.EMAIL} for order_id=${payload.order_id}`,
        e?.stack,
      );
    }
  }
}

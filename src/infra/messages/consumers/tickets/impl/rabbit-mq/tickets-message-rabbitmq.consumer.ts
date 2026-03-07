import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { TicketsService } from '@/modules/tickets/tickets.service';
import { MessageQueues } from '../../../enums';
import { IEmailsMessageProducer } from '@/infra/messages/producers/emails/interfaces/iemails-message-producer.interface';
import { IEmailsEventsConsumer } from '../../../emails/interfaces/iemails-events.consumer';

@Controller()
export class TicketsMessageRabbitMqConsumer implements IEmailsEventsConsumer {
  private readonly logger = new Logger(TicketsMessageRabbitMqConsumer.name);

  constructor(
    private readonly emailsMessageProducer: IEmailsMessageProducer,
    private readonly ticketsService: TicketsService,
  ) {}

  @EventPattern(MessageQueues.TICKET_GENERATE)
  async handle(
    @Payload() payload: { order_id: string },
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received message on queue ${MessageQueues.TICKET_GENERATE} for order_id=${payload.order_id}`,
      payload,
    );

    try {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();

      await this.ticketsService.handleGenerate(payload.order_id);

      this.logger.log(
        `Successfully processed message on queue ${MessageQueues.TICKET_GENERATE} for order_id=${payload.order_id}`,
        payload,
      );

      channel.ack(originalMessage);

      this.emailsMessageProducer.emit();
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.TICKET_GENERATE} for order_id=${payload.order_id}`,
        e?.stack,
      );
    }
  }
}

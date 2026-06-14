import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { IEmailsMessageProducer } from '../interfaces/iemails-message-producer.interface';
import { MessageQueues } from '@/infra/messages/consumers/enums';

@Injectable()
export class EmailsMessageRabbitMqProducer implements IEmailsMessageProducer {
  private readonly logger = new Logger(EmailsMessageRabbitMqProducer.name);

  constructor(
    @Inject('email_queue')
    private readonly rabbitMqClient: ClientProxy,
  ) {}

  emit(payload: { order_id: string; to: string }) {
    this.rabbitMqClient.emit(MessageQueues.EMAIL, payload);

    this.logger.log(`Publish message on queue ${MessageQueues.EMAIL}.`);
  }
}

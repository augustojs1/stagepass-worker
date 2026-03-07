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

  emit() {
    this.rabbitMqClient.emit(MessageQueues.EMAIL, {});

    this.logger.log(`Publish message on queue ${MessageQueues.EMAIL}.`);
  }
}

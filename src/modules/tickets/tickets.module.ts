import { forwardRef, Module } from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { OrdersModule } from '../orders/orders.module';
import {
  TicketPdfGeneratorProvider,
  TicketStoragePathFactory,
} from './providers';
import { R2StorageService } from '@/infra/storage';
import { AppHttpModule } from '@/infra/http/http.module';
import { EmailsModule } from '@/infra/emails/emails.module';
import { MessagesModule } from '@/infra/messages/messages.module';
import { EmailsService } from '@/infra/emails/emails.service.interface';
import { NodemailerEmailService } from '@/infra/emails/impl/nodemailer.service';

@Module({
  imports: [
    OrdersModule,
    AppHttpModule,
    EmailsModule,
    forwardRef(() => MessagesModule),
  ],
  providers: [
    TicketsService,
    TicketsRepository,
    TicketPdfGeneratorProvider,
    R2StorageService,
    TicketStoragePathFactory,
    {
      provide: EmailsService,
      useClass: NodemailerEmailService,
    },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}

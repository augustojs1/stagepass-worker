import { Module } from '@nestjs/common';

import { EmailsService } from './email.service';
import { SMTPModule } from '@/infra/smtp/smtp.module';
import { SMTPService } from '@/infra/smtp/smtp.service.interface';
import { EtherealSMTPService } from '@/infra/smtp/impl/ethereal-smtp.service';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [SMTPModule, TicketsModule],
  providers: [
    {
      provide: SMTPService,
      useClass: EtherealSMTPService,
    },
    EmailsService,
  ],
  exports: [EmailsService],
})
export class EmailsModule {}

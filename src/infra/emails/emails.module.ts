import { Module } from '@nestjs/common';

import { EmailsService } from './emails.service.interface';
import { NodemailerEmailService } from './impl/nodemailer.service';

@Module({
  providers: [
    {
      provide: EmailsService,
      useClass: NodemailerEmailService,
    },
  ],
  exports: [EmailsService],
})
export class EmailsModule {}

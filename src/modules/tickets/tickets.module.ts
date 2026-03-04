import { Module } from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { OrdersModule } from '../orders/orders.module';
import { TicketPdfGeneratorProvider } from './providers';

@Module({
  providers: [TicketsService, TicketsRepository, TicketPdfGeneratorProvider],
  imports: [OrdersModule],
  exports: [TicketsService],
})
export class TicketsModule {}

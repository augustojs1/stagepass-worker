import { Module } from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { OrdersModule } from '../orders/orders.module';
import {
  TicketPdfGeneratorProvider,
  TicketStoragePathFactory,
} from './providers';
import { R2StorageService } from '@/infra/storage';
import { AppHttpModule } from '@/infra/http/http.module';

@Module({
  imports: [OrdersModule, AppHttpModule],
  providers: [
    TicketsService,
    TicketsRepository,
    TicketPdfGeneratorProvider,
    R2StorageService,
    TicketStoragePathFactory,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}

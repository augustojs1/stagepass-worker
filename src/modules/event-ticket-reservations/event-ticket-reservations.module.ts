import { Module } from '@nestjs/common';

import { EventTicketReservationsService } from './event-ticket-reservations.service';

@Module({
  controllers: [],
  providers: [EventTicketReservationsService],
})
export class EventTicketReservationsModule {}

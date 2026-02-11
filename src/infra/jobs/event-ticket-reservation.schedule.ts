import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EventTicketReservationScheduler {
  private readonly logger = new Logger(EventTicketReservationScheduler.name);

  constructor() {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'expire-ticket-reservations',
  })
  async expireTicketReservations() {
    this.logger.log('Running routine to expire ticket reservations...');
  }
}

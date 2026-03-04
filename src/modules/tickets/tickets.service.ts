import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

import { TicketsRepository } from './tickets.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { TicketPdfGeneratorProvider } from './providers';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly ticketPdfGeneratorProvider: TicketPdfGeneratorProvider,
  ) {}

  async handleGenerate(order_id: string): Promise<void> {
    try {
      const order = await this.ordersRepository.findById(order_id);

      if (!order) {
        return;
      }

      if (order.status !== 'PAID') {
        return;
      }

      const ticketData =
        await this.ordersRepository.findOrderAndOrderItemAndEventById(order_id);

      // create ticket row
      const ticket = await this.ticketsRepository.create({
        owner_id: ticketData.owner_id,
        order_id: ticketData.order_id,
        event_ticket_id: ticketData.event_ticket_id,
        code: `STP_${randomUUID()}`,
      });

      // Generate QR Code tickets with PDFKit
      const pdfBuffer = await this.ticketPdfGeneratorProvider.generate({
        ...ticketData,
        code: ticket.code,
      });

      this.ticketPdfGeneratorProvider.saveOnDisk(pdfBuffer, ticket.code);

      // Save PDF to R2
      // Send tickets via email
    } catch (error) {
      console.log('error.:', error);

      this.logger.error('');
    }
  }
}

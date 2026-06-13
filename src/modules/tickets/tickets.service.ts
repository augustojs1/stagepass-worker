import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TicketsRepository } from './tickets.repository';
import { OrdersRepository } from '../orders/orders.repository';
import {
  TicketPdfGeneratorProvider,
  TicketStoragePathFactory,
} from './providers';
import { R2StorageService } from '@/infra/storage';
import { HTTP_UPLOADER } from '@/infra/http/http.module';
import { HttpClientService } from '@/infra/http/http-client.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject(HTTP_UPLOADER)
    private readonly httpClientService: HttpClientService,
    private readonly ticketsRepository: TicketsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly ticketPdfGeneratorProvider: TicketPdfGeneratorProvider,
    private readonly r2StorageService: R2StorageService,
    private readonly ticketStoragePathFactory: TicketStoragePathFactory,
    private readonly configService: ConfigService,
  ) {}

  async handleGenerate(order_id: string): Promise<void> {
    try {
      const order = await this.ordersRepository.findById(order_id);

      if (!order) {
        this.logger.log(`Order order_id=${order_id} not found!`);
        return;
      }

      if (order.status !== 'PAID') {
        this.logger.log(`Order order_id=${order_id} is not paid!`);
        return;
      }

      const ticketsToGenerate =
        await this.ordersRepository.findOrderAndOrderItemAndEventById(order_id);

      for (const ticket of ticketsToGenerate) {
        const ticketCode = `STP_${randomUUID()}`;

        const createdTicket = await this.ticketsRepository.create({
          owner_id: ticket.owner_id,
          order_id: ticket.order_id,
          event_ticket_id: ticket.event_ticket_id,
          code: ticketCode,
        });

        this.logger.log(
          `Successfully created ticket 
          order_id=${createdTicket.order_id}, 
          owner_id${createdTicket.owner_id}
          code=${createdTicket.code}
          `,
        );

        const pdfBuffer = await this.ticketPdfGeneratorProvider.generate({
          ...ticket,
          code: createdTicket.code,
        });

        this.logger.log(
          `Successfully generated PDF ticket 
          order_id=${createdTicket.order_id}, 
          owner_id${createdTicket.owner_id}
          code=${createdTicket.code}
          `,
        );

        const ticketKey = this.ticketStoragePathFactory.generateKey({
          order_id: createdTicket.order_id,
          code: ticketCode,
          owner_id: createdTicket.owner_id,
        });

        const response = await this.r2StorageService.createPresignedUploadUrl(
          ticketKey,
          2000,
          'application/pdf',
        );

        await this.uploadPdfToPresignedUrl(response.uploadUrl, pdfBuffer);

        const ticketPublicUrl = this.ticketStoragePathFactory.generateUrl({
          order_id: createdTicket.order_id,
          code: ticketCode,
          owner_id: createdTicket.owner_id,
          publicUrl: this.configService.get<string>('r2.public_url'),
        });

        await this.ticketsRepository.updateFileUrl(
          createdTicket.id,
          ticketPublicUrl,
        );

        this.logger.log(
          `Successfully saved PDF file ticket URL 
          order_id=${createdTicket.order_id}, 
          owner_id${createdTicket.owner_id}
          code=${createdTicket.code}
          `,
        );

        // Send tickets via email
      }
    } catch (error) {
      this.logger.error(
        `An error has occured while trying to generate tickets for order ${order_id}`,
        error,
      );
      throw error;
    }
  }

  async uploadPdfToPresignedUrl(
    uploadUrl: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    try {
      await this.httpClientService.putBinary(uploadUrl, pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.length,
        },
        timeoutMs: 30_000,
        responseType: 'text',
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: (s) => s >= 200 && s < 300,
      });

      this.logger.log(`Success to upload PDF ticket.`);
    } catch (err: any) {
      this.logger.error(`Failed to upload PDF ticket.`, err);
      throw err;
    }
  }
}

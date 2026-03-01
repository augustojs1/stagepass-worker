import {
  Controller,
  Inject,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { inArray } from 'drizzle-orm';

import * as schemas from '@/infra/database/orm/drizzle/schemas';
import { MessageQueues } from '../../enums';
import { IPaymentEventsConsumer } from '../../payment/interfaces/ipayments-events.consumer';
import { PaymentFailedPayload } from '../../models';
import { PaymentOrdersService } from '@/modules/payment-orders/payment-orders.service';
import { SuccessPaymentEventPayload } from '../../models/success-payment-event-payload.model';
import { DATABASE_TAG } from '@/infra/database/orm/drizzle/drizzle.module';
import { PaymentOrdersRepository } from '@/modules/payment-orders/payment-orders.repository';
import { OrdersRepository } from '@/modules/orders/orders.repository';
import { EventTicketReservationsRepository } from '@/modules/event-ticket-reservations/event-ticket-reservations.repository';
import { EventTicketsRepository } from '@/modules/event-tickets/event-tickets.repository';
import { PaymentGatewayWebhookEventsRepository } from '@/infra/payment-gateway/payment-gateway-webhook-events.repository';

@Controller()
export class PaymentMessageRabbitMqConsumer implements IPaymentEventsConsumer {
  private readonly logger = new Logger(PaymentMessageRabbitMqConsumer.name);

  constructor(
    @Inject(DATABASE_TAG)
    private readonly drizzle: PostgresJsDatabase<typeof schemas>,
    private readonly paymentOrderService: PaymentOrdersService,
    private readonly paymentOrderRepository: PaymentOrdersRepository,
    private readonly orderRepository: OrdersRepository,
    private readonly eventTicketReservationRepository: EventTicketReservationsRepository,
    private readonly eventTicketsRepository: EventTicketsRepository,
    private readonly paymentGatewayWebhookEventsRepository: PaymentGatewayWebhookEventsRepository,
  ) {}

  @EventPattern(MessageQueues.PAYMENT_FAILED)
  async handleFailed(
    @Payload() payload: PaymentFailedPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    try {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();

      this.logger.log(
        `Receveid message on queue ${MessageQueues.PAYMENT_FAILED}`,
        payload,
      );

      await this.paymentOrderService.updateByProviderReferenceId({
        status: 'FAILED',
        ...payload,
      });

      await this.drizzle.transaction(async (trx) => {
        await this.orderRepository.updateByProviderReferenceIdTrx(trx, {
          id: payload.order_id,
          status: 'FAILED',
        });

        await this.paymentGatewayWebhookEventsRepository.updateByProviderReferenceIdTrx(
          trx,
          {
            process: 'PROCESSED',
            provider_reference_id: payload.provider_reference_id,
            receipt_url: null,
          },
        );
      });

      channel.ack(originalMessage);
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.PAYMENT_FAILED} for order_id=${payload.order_id}, provider_reference_id=${payload.provider_reference_id}`,
        e?.stack,
      );
    }
  }

  @EventPattern(MessageQueues.PAYMENT_SUCESS)
  async handleSucces(
    @Payload() payload: SuccessPaymentEventPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    try {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();

      this.logger.log(
        `Receveid message on queue ${MessageQueues.PAYMENT_SUCESS}`,
        payload,
      );

      await this.drizzle.transaction(async (trx) => {
        await this.paymentOrderRepository.updateByProviderReferenceIdTrx(trx, {
          provider_reference_id: payload.provider_reference_id,
          receipt_url: payload.receipt_url,
        });

        await this.orderRepository.updateByProviderReferenceIdTrx(trx, {
          id: payload.order_id,
          status: 'PAID',
        });

        await this.eventTicketReservationRepository.updateActiveReservationsByOrderIdTrx(
          trx,
          {
            order_id: payload.order_id,
            active: false,
          },
        );

        const eventTicketsOrder =
          await this.orderRepository.getTicketsByOrderId(trx, payload.order_id);

        const eventTicketAmmountToBuy = new Map<string, number>();

        for (const ticket of eventTicketsOrder) {
          if (!ticket.ticket_id) continue;

          const amount =
            (eventTicketAmmountToBuy.get(ticket.ticket_id) ?? 0) + 1;

          eventTicketAmmountToBuy.set(ticket.ticket_id, amount);
        }

        const eventTicketIds = [...eventTicketAmmountToBuy.keys()];

        const eventTickets = await trx
          .select()
          .from(schemas.event_tickets)
          .where(inArray(schemas.event_tickets.id, eventTicketIds))
          .for('update');

        for (const ticket of eventTickets) {
          if (eventTicketAmmountToBuy.get(ticket.id) > ticket.amount) {
            this.logger.error(
              `Failed to process order=${payload.order_id} with ${payload.provider_reference_id} provider reference Id:: Amount of ${eventTicketAmmountToBuy.get(ticket.id)} of event_ticket_id=${ticket.id} is bigger than the ${ticket.amount} amount of tickets!`,
            );

            throw new UnprocessableEntityException(
              `Amount of ${eventTicketAmmountToBuy.get(ticket.id)} of event_ticket_id=${ticket.id} is bigger than the ${ticket.amount} amount of tickets!`,
            );
          }

          const updatedAmmount =
            ticket.amount - eventTicketAmmountToBuy.get(ticket.id);

          await this.eventTicketsRepository.updateTrx(trx, {
            id: ticket.id,
            amount: updatedAmmount,
          });
        }

        await this.paymentGatewayWebhookEventsRepository.updateByProviderReferenceIdTrx(
          trx,
          {
            process: 'PROCESSED',
            provider_reference_id: payload.provider_reference_id,
            receipt_url: payload.receipt_url,
          },
        );

        // Gerar tickets
        // etc.
      });

      channel.ack(originalMessage);

      this.logger.log(
        `Successfuly processed payment for order_id=${payload.order_id}`,
      );
    } catch (error) {
      const e = error as Error;

      this.logger.error(
        `Failed to process ${MessageQueues.PAYMENT_SUCESS} for order_id=${payload.order_id}, provider_reference_id=${payload.provider_reference_id}`,
        e?.stack,
      );
    }
  }
}

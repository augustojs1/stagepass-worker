import { Inject, Injectable } from '@nestjs/common';
import { eq, ExtractTablesWithRelations } from 'drizzle-orm';
import {
  PostgresJsDatabase,
  PostgresJsQueryResultHKT,
} from 'drizzle-orm/postgres-js';
import { PgTransaction } from 'drizzle-orm/pg-core';

import * as schema from '@/infra/database/orm/drizzle/schemas';
import { DATABASE_TAG } from '@/infra/database/orm/drizzle/drizzle.module';
import { OrdersEntity } from '@/modules/orders/models/orders-entity.model';

@Injectable()
export class OrdersRepository {
  constructor(
    @Inject(DATABASE_TAG)
    private readonly drizzle: PostgresJsDatabase<typeof schema>,
  ) {}

  async updateByProviderReferenceIdTrx(
    trx: PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >,
    orderEntity: Partial<OrdersEntity>,
  ): Promise<void> {
    // await trx
    //           .update(schemas.orders)
    //           .set({
    //             status: 'PAID',
    //           })
    //           .where(eq(schemas.orders.id, payload.order_id));

    await trx
      .update(schema.orders)
      .set({
        status: orderEntity.status,
      })
      .where(eq(schema.orders.id, orderEntity.id));
  }

  async getTicketsByOrderId(
    trx: PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >,
    order_id: string,
  ): Promise<
    {
      ticket_id: string;
      ticket_amount: number;
    }[]
  > {
    // const eventTicketsOrder = await trx
    //           .select({
    //             ticket_id: schemas.event_tickets.id,
    //             ticket_amount: schemas.event_tickets.amount,
    //           })
    //           .from(schemas.order_item)
    //           .innerJoin(
    //             schemas.event_tickets,
    //             eq(schemas.event_tickets.id, schemas.order_item.event_ticket_id),
    //           )
    //           .where(eq(schemas.order_item.order_id, payload.order_id));

    const result = await trx
      .select({
        ticket_id: schema.event_tickets.id,
        ticket_amount: schema.event_tickets.amount,
      })
      .from(schema.order_item)
      .innerJoin(
        schema.event_tickets,
        eq(schema.event_tickets.id, schema.order_item.event_ticket_id),
      )
      .where(eq(schema.order_item.order_id, order_id));

    return result;
  }
}

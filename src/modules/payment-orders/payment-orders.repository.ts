import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import * as schema from '@/modules/payment-orders/entities';
import { DATABASE_TAG } from '@/infra/database/orm/drizzle/drizzle.module';
import { PaymentOrderEntity } from './models/payment-order-entity.model';

@Injectable()
export class PaymentOrdersRepository {
  constructor(
    @Inject(DATABASE_TAG)
    private readonly drizzle: PostgresJsDatabase<typeof schema>,
  ) {}

  async find(order_id: string): Promise<PaymentOrderEntity> {
    const result = await this.drizzle
      .select()
      .from(schema.payment_orders)
      .where(eq(schema.payment_orders.order_id, order_id));

    return result[0] ?? null;
  }

  async updateByOrderId(
    paymentOrderEntity: Partial<PaymentOrderEntity>,
  ): Promise<void> {
    await this.drizzle
      .update(schema.payment_orders)
      .set({
        ...paymentOrderEntity,
      })
      .where(eq(schema.payment_orders.order_id, paymentOrderEntity.order_id));
  }
}

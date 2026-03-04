import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DATABASE_TAG } from '@/infra/database/orm/drizzle/drizzle.module';
import * as schema from '@/infra/database/orm/drizzle/schemas';
import { InsertTicketParams } from './models/insert-ticket-params.model';
import { TicketEntity } from './models';

@Injectable()
export class TicketsRepository {
  constructor(
    @Inject(DATABASE_TAG)
    private readonly drizzle: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: InsertTicketParams): Promise<TicketEntity> {
    const result = await this.drizzle
      .insert(schema.tickets)
      .values({
        ...data,
      })
      .returning();

    return result[0];
  }
}

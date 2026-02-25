import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { configuration } from '@/infra/config/configuration';
import { DrizzleModule } from '@/infra/database/orm/drizzle/drizzle.module';
import { HttpRequestInterceptor } from '@/infra/interceptors';
import { EventTicketReservationsModule } from './modules/event-ticket-reservations/event-ticket-reservations.module';
import { SchedulerModule } from './infra/jobs/scheduler.module';
import { MessagesModule } from './infra/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/src/infra/config/env/${process.env.NODE_ENV}.env`,
      isGlobal: true,
      load: [configuration],
    }),
    DrizzleModule,
    EventTicketReservationsModule,
    EventTicketReservationsModule,
    SchedulerModule,
    MessagesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpRequestInterceptor,
    },
  ],
})
export class AppModule {}

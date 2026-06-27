import { Injectable, Logger } from '@nestjs/common';

import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  async findOrderEmailTemplateDataById(order_id: string) {
    const data =
      await this.ordersRepository.findOrderEmailTemplateDataById(order_id);

    if (!data) {
      throw new Error(
        `No order email template data found for order_id=${order_id}`,
      );
    }

    return data;
  }
}

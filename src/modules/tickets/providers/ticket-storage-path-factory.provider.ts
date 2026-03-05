import { Injectable } from '@nestjs/common';

type GenerateUrlParams = {
  publicUrl: string;
  owner_id: string;
  order_id: string;
  code: string;
};

@Injectable()
export class TicketStoragePathFactory {
  generateKey(code: string): string {
    return `${code}.pdf`;
  }

  generateUrl(params: GenerateUrlParams): string {
    return `${params.publicUrl}/user_${params.owner_id}/tickets/order_${params.order_id}/${params.code}.pdf`;
  }
}

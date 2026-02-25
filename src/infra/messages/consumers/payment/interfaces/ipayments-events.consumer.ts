export abstract class IPaymentEventsConsumer {
  abstract handleSucces(data: any, context: any): Promise<void>;
  abstract handleFailed(data: any, context: any): Promise<void>;
}

export abstract class IEmailsMessageProducer {
  abstract emit(payload: any): void;
}

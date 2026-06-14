import { SendEmailPayload } from './models/send-email-payload.model';

export abstract class EmailsService {
  abstract sendEmail(options: SendEmailPayload);
}

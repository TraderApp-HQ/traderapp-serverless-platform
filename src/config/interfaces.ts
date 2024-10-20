import { SQSRecord } from "aws-lambda";
import { EventTemplate } from "src/config/enums";

export interface IMessageRecipient {
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    emailAddress?: string;
    countryPhoneCode?: string;
}

export interface IQueueMessageBodyObject {
    recipients: [IMessageRecipient];
    subject?: string;
    message: string;
    event: EventTemplate;
}

export interface IQueueMessageBody extends Omit<SQSRecord, "body"> {
    body: IQueueMessageBodyObject;
}

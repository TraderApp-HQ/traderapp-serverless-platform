import { SQSRecord } from "aws-lambda";
import { EventTemplate } from "src/config/enums";

export interface IEmailRecipient { 
    firstName: string 
    lastName?: string 
    emailAddress: string 
}
export interface IEmailMessageObject {
	recipients: [IEmailRecipient];
	subject?: string;
	message: string;
}

export interface IQueueEmailMessageBodyObject {
	messageObject: IEmailMessageObject;
	event: EventTemplate;
}

export interface IQueueEmailMessageBody extends Omit<SQSRecord, "body"> {
	body: IQueueEmailMessageBodyObject;
}
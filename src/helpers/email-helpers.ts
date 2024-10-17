import { EventTemplate } from "src/config/enums";
import { IEmailRecipient } from "src/config/interfaces";
import { CreateUserTemplate, GeneralTemplate, GetStartedTemplate, OtpTemplate, PasswordResetTemplate } from "src/templates/email-templates";

interface IFormatEmailMessageInput {
    recipient: IEmailRecipient
	message: string
    event: EventTemplate
}

export const formatEmailMessageBody =({
    recipient,
    message,
    event
}: IFormatEmailMessageInput) => {
	let templateBody = "";
	switch (event) {
		case EventTemplate.GENERAL: {
			templateBody = GeneralTemplate;
			templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
			templateBody = templateBody.replace(/{BODY}/g, message);
			break;
		}
		case EventTemplate.OTP: {
			templateBody = OtpTemplate;
			templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
			templateBody = templateBody.replace(/{OTP}/g, message);
			break;
		}
		case EventTemplate.RESET_PASSWORD: {
			templateBody = PasswordResetTemplate;
			templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
			templateBody = templateBody.replace(/{RESET_LINK}/g, message);
			break;
		}
		case EventTemplate.CREATE_USER: {
			templateBody = CreateUserTemplate;
			templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
			templateBody = templateBody.replace(/{RESET_LINK}/g, message);
			break;
		}
		case EventTemplate.WELCOME: {
			templateBody = GetStartedTemplate;
			templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
			break;
		}
		default: throw new Error(`No email event with name ${event}`);
	}

    return templateBody;
}
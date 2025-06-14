import { EventTemplate } from "src/config/enums";
import { IMessageRecipient } from "src/config/interfaces";
import {
    CreateUserTemplate,
    GeneralTemplate,
    GetStartedTemplate,
    OtpTemplate,
    PasswordResetTemplate,
    ReferralTemplate,
} from "src/templates/email-templates";

interface IFormatEmailMessageInput {
    recipient: IMessageRecipient;
    message: string;
    event: EventTemplate;
    sender?: IMessageRecipient;
}

export const formatEmailMessageBody = ({
    recipient,
    message,
    event,
    sender,
}: IFormatEmailMessageInput) => {
    let templateBody = "";
    switch (event) {
        case EventTemplate.GENERAL: {
            templateBody = GeneralTemplate;
            templateBody = templateBody.replace(
                /{USER_NAME}/g,
                recipient.firstName
            );
            templateBody = templateBody.replace(/{BODY}/g, message);
            break;
        }
        case EventTemplate.OTP: {
            templateBody = OtpTemplate;
            templateBody = templateBody.replace(
                /{USER_NAME}/g,
                recipient.firstName
            );
            templateBody = templateBody.replace(/{OTP}/g, message);
            break;
        }
        case EventTemplate.RESET_PASSWORD: {
            templateBody = PasswordResetTemplate;
            templateBody = templateBody.replace(
                /{USER_NAME}/g,
                recipient.firstName
            );
            templateBody = templateBody.replace(/{RESET_LINK}/g, message);
            break;
        }
        case EventTemplate.CREATE_USER: {
            templateBody = CreateUserTemplate;
            templateBody = templateBody.replace(
                /{USER_NAME}/g,
                recipient.firstName
            );
            templateBody = templateBody.replace(/{RESET_LINK}/g, message);
            break;
        }
        case EventTemplate.WELCOME: {
            templateBody = GetStartedTemplate;
            templateBody = templateBody.replace(
                /{USER_NAME}/g,
                recipient.firstName
            );
            break;
        }
        case EventTemplate.INVITE_USER: {
            templateBody = ReferralTemplate;
            templateBody = templateBody.replace(/{REFERRAL_LINK}/g, message);
            templateBody = templateBody.replace(
                /{REFERRER}/g,
                `${sender?.firstName} ${sender?.lastName}`
            );
            break;
        }
        default:
            throw new Error(`No email event with name ${event}`);
    }

    return templateBody;
};

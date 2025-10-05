import { EventTemplate } from "src/config/enums";
import { IMessageRecipient, IMetadata } from "src/config/interfaces";
import {
    CreateUserTemplate,
    GeneralTemplate,
    GetStartedTemplate,
    OtpTemplate,
    PasswordResetTemplate,
    ReferralTemplate,
} from "src/templates/email-templates";
import SendDepositConfirmationEmailTemplate from "src/templates/email-templates/send-deposit-confirmation-email-template";

interface IFormatEmailMessageInput {
    recipient: IMessageRecipient;
    message: string;
    event: EventTemplate;
    sender?: IMessageRecipient;
    metadata?: IMetadata;
}

const applyReplacements = (
    template: string,
    replacements: Record<string, string | undefined>
): string => {
    console.log("######### inside applyReplacements ############", {
        replacements,
    });
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
        if (value) {
            result = result.replace(new RegExp(`{${key}}`, "g"), value);
        }
    }
    return result;
};

export const formatEmailMessageBody = ({
    recipient,
    message,
    event,
    sender,
    metadata,
}: IFormatEmailMessageInput): string => {
    console.log("######### insideformatEmailMessageBody ############", {
        recipient,
        message,
        event,
        sender,
        metadata,
    });
    switch (event) {
        case EventTemplate.GENERAL:
            return applyReplacements(GeneralTemplate, {
                USER_NAME: recipient.firstName,
                BODY: message,
            });

        case EventTemplate.OTP:
            return applyReplacements(OtpTemplate, {
                USER_NAME: recipient.firstName,
                OTP: message,
            });

        case EventTemplate.RESET_PASSWORD:
            return applyReplacements(PasswordResetTemplate, {
                USER_NAME: recipient.firstName,
                RESET_LINK: message,
            });

        case EventTemplate.CREATE_USER:
            return applyReplacements(CreateUserTemplate, {
                USER_NAME: recipient.firstName,
                RESET_LINK: message,
            });

        case EventTemplate.WELCOME:
            return applyReplacements(GetStartedTemplate, {
                USER_NAME: recipient.firstName,
            });

        case EventTemplate.SEND_DEPOSIT_CONFIRMATION_EMAIL: {
            console.log("######### inside SendDepositConfirmationEmailTemplate ############", {
                recipient,
                message,
                event,
                sender,
                metadata,
            });
            return applyReplacements(SendDepositConfirmationEmailTemplate, {
                USER_NAME: recipient.firstName,
                AMOUNT: metadata?.amount?.toString(),
                TRANSACTION_ID: metadata?.transactionId,
            });
        }
        case EventTemplate.INVITE_USER:
            return applyReplacements(ReferralTemplate, {
                REFERRAL_LINK: message,
                REFERRER: `${sender?.firstName ?? ""} ${sender?.lastName ?? ""}`,
            });

        default:
            throw new Error(`No email event with name ${event}`);
    }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEmailMessageBody = void 0;
const enums_1 = require("src/config/enums");
const email_templates_1 = require("src/templates/email-templates");
const send_deposit_confirmation_email_template_1 = __importDefault(require("src/templates/email-templates/send-deposit-confirmation-email-template"));
const applyReplacements = (template, replacements) => {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
        if (value) {
            result = result.replace(new RegExp(`{${key}}`, "g"), value);
        }
    }
    return result;
};
const formatEmailMessageBody = ({ recipient, message, event, sender, metadata, }) => {
    switch (event) {
        case enums_1.EventTemplate.GENERAL:
            return applyReplacements(email_templates_1.GeneralTemplate, {
                USER_NAME: recipient.firstName,
                BODY: message,
            });
        case enums_1.EventTemplate.OTP:
            return applyReplacements(email_templates_1.OtpTemplate, {
                USER_NAME: recipient.firstName,
                OTP: message,
            });
        case enums_1.EventTemplate.RESET_PASSWORD:
            return applyReplacements(email_templates_1.PasswordResetTemplate, {
                USER_NAME: recipient.firstName,
                RESET_LINK: message,
            });
        case enums_1.EventTemplate.CREATE_USER:
            return applyReplacements(email_templates_1.CreateUserTemplate, {
                USER_NAME: recipient.firstName,
                RESET_LINK: message,
            });
        case enums_1.EventTemplate.WELCOME:
            return applyReplacements(email_templates_1.GetStartedTemplate, {
                USER_NAME: recipient.firstName,
            });
        case enums_1.EventTemplate.SEND_DEPOSIT_CONFIRMATION_EMAIL: {
            return applyReplacements(send_deposit_confirmation_email_template_1.default, {
                USER_NAME: recipient.firstName,
                AMOUNT: metadata?.amount?.toString(),
                TRANSACTION_ID: metadata?.transactionId,
                DATE_TIME: metadata?.dateTime,
            });
        }
        case enums_1.EventTemplate.INVITE_USER:
            return applyReplacements(email_templates_1.ReferralTemplate, {
                REFERRAL_LINK: message,
                REFERRER: `${sender?.firstName ?? ""} ${sender?.lastName ?? ""}`,
            });
        default:
            throw new Error(`No email event with name ${event}`);
    }
};
exports.formatEmailMessageBody = formatEmailMessageBody;

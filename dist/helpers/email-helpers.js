"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEmailMessageBody = void 0;
const enums_1 = require("src/config/enums");
const email_templates_1 = require("src/templates/email-templates");
const formatEmailMessageBody = ({ recipient, message, event, }) => {
    let templateBody = "";
    switch (event) {
        case enums_1.EventTemplate.GENERAL: {
            templateBody = email_templates_1.GeneralTemplate;
            templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
            templateBody = templateBody.replace(/{BODY}/g, message);
            break;
        }
        case enums_1.EventTemplate.OTP: {
            templateBody = email_templates_1.OtpTemplate;
            templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
            templateBody = templateBody.replace(/{OTP}/g, message);
            break;
        }
        case enums_1.EventTemplate.RESET_PASSWORD: {
            templateBody = email_templates_1.PasswordResetTemplate;
            templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
            templateBody = templateBody.replace(/{RESET_LINK}/g, message);
            break;
        }
        case enums_1.EventTemplate.CREATE_USER: {
            templateBody = email_templates_1.CreateUserTemplate;
            templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
            templateBody = templateBody.replace(/{RESET_LINK}/g, message);
            break;
        }
        case enums_1.EventTemplate.WELCOME: {
            templateBody = email_templates_1.GetStartedTemplate;
            templateBody = templateBody.replace(/{USER_NAME}/g, recipient.firstName);
            break;
        }
        default:
            throw new Error(`No email event with name ${event}`);
    }
    return templateBody;
};
exports.formatEmailMessageBody = formatEmailMessageBody;

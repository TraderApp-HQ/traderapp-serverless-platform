"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionNotificationTemplate = exports.PasswordResetTemplate = exports.OtpTemplate = exports.GetStartedTemplate = exports.GeneralTemplate = exports.CreateUserTemplate = void 0;
var create_user_template_1 = require("./create-user-template");
Object.defineProperty(exports, "CreateUserTemplate", { enumerable: true, get: function () { return __importDefault(create_user_template_1).default; } });
var general_1 = require("./general");
Object.defineProperty(exports, "GeneralTemplate", { enumerable: true, get: function () { return __importDefault(general_1).default; } });
var get_started_template_1 = require("./get-started-template");
Object.defineProperty(exports, "GetStartedTemplate", { enumerable: true, get: function () { return __importDefault(get_started_template_1).default; } });
var otp_1 = require("./otp");
Object.defineProperty(exports, "OtpTemplate", { enumerable: true, get: function () { return __importDefault(otp_1).default; } });
var password_reseet_template_1 = require("./password-reseet-template");
Object.defineProperty(exports, "PasswordResetTemplate", { enumerable: true, get: function () { return __importDefault(password_reseet_template_1).default; } });
var transaction_notification_template_1 = require("./transaction-notification-template");
Object.defineProperty(exports, "TransactionNotificationTemplate", { enumerable: true, get: function () { return __importDefault(transaction_notification_template_1).default; } });

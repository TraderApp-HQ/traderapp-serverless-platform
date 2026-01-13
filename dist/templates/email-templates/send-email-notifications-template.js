"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/templates/email-templates/send-email-notifications-template.ts
var send_email_notifications_template_exports = {};
__export(send_email_notifications_template_exports, {
  SendEmailTemplate: () => SendEmailTemplate,
  default: () => send_email_notifications_template_default
});
module.exports = __toCommonJS(send_email_notifications_template_exports);
var SendEmailTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Transaction Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9fafb;
        color: #111827;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        padding: 32px;
      }
      h2 {
        color: #111827;
        margin-bottom: 20px;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin: 8px 0;
      }
      .highlight {
        font-weight: bold;
        color: #2563eb;
      }
      .footer {
        margin-top: 32px;
        font-size: 14px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Hello {USER_NAME},</h2>
      <p>Your transaction of <span class="highlight">\u20A6{AMOUNT}</span> was successful.</p>
      <p>Reference ID: <span class="highlight">{REF}</span></p>
      <p>If you didn\u2019t make this transaction, please contact our support team immediately.</p>
      <div class="footer">
        <p>Thanks for using our service,</p>
        <p><strong>The Support Team</strong></p>
      </div>
    </div>
  </body>
</html>
`;
var send_email_notifications_template_default = SendEmailTemplate;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SendEmailTemplate
});

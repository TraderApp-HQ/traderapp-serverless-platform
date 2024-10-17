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

// src/templates/email-templates/transaction-notification-template.ts
var transaction_notification_template_exports = {};
__export(transaction_notification_template_exports, {
  default: () => transaction_notification_template_default
});
module.exports = __toCommonJS(transaction_notification_template_exports);
var transactionNotificationTemplate = `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title> TraderApp </title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style>
  <!--[if mso]>
        <noscript>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        </noscript>
        <![endif]-->
  <!--[if lte mso 11]>
        <style type="text/css">
          .mj-outlook-group-fix { width:100% !important; }
        </style>
        <![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" rel="stylesheet" type="text/css">
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700);
  </style>
  <!--<![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>
  <style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }
  </style>
  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }
  </style>
  <style type="text/css">
    .br_20 {
      border: 1px solid #D1D7F0;
      border-radius: 10px !important;
    }

    .otp {
      width: 500px !important;
      background: red;
    }
  </style>
</head>

<body style="word-spacing:normal;background-color:white;">
  <div style="background-color:white;">
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="br_20-outlook" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div class="br_20" style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                                    <tbody>
                                      <tr>
                                        <td style="width:150px;">
                                          <img height="auto" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150" />
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:300;line-height:1;text-align:left;color:#000000;">Hi {USER_NAME}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">We wish to inform you that a Credit transaction occurred on your account with us.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">The details of this transaction are shown below:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:1;text-align:left;color:#000000;">Transaction Notification</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Account Number : 234568712</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Transaction Location : Shelter farm kubwa Abuja</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Description : FAILED NIBSS INSTANT PAYMENT</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Amount : $ 112.87,000</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Time of Transaction : 29-02-2024 18:00</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">The balances on this account as at 29-02-2024 18:00 are as follows;</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Current wallet : $ 33,304.6900000</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">Thanks for signing up. If you have any questions, send us a message at hi@traderappi.com or on Twitter. We\u2019d love to hear from you.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;line-height:1;text-align:left;color:#000000;">\u2014 The team</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" vertical-align="middle" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tr>
                                      <td align="center" bgcolor="#1836B2" role="presentation" style="border:none;border-radius:6px;cursor:auto;mso-padding-alt:10px 25px;background:#1836B2;" valign="middle">
                                        <a href="https://traderapp.finance" style="display:inline-block;background:#1836B2;color:#ffffff;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:6px;" target="_blank"> Get started </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:300;line-height:1;text-align:left;color:#000000;">Thanks,</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:0;text-align:left;color:#000000;">TraderApp Team.</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:0px;word-break:break-word;">
                                  <div style="height:20px;line-height:20px;">&#8202;</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" vertical-align="middle" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <!--[if mso | IE]><table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;vertical-align:middle;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                          <tr>
                                            <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                              <a href="https://x.com/traderapp" target="_blank">
                                                <img height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="25" />
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <!--[if mso | IE]></td><td><![endif]-->
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;vertical-align:middle;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                          <tr>
                                            <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                              <a href="https://www.facebook.com/traderappofficial?mibextid=ZbWKwL" target="_blank">
                                                <img height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="25" />
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <!--[if mso | IE]></td><td><![endif]-->
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;vertical-align:middle;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                          <tr>
                                            <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                              <a href="https://instagram.com/traderapphq" target="_blank">
                                                <img height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="25" />
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <!--[if mso | IE]></td><td><![endif]-->
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;vertical-align:middle;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                          <tr>
                                            <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                              <a href="https://traderapp.finance/#" target="_blank">
                                                <img height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="25" />
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <!--[if mso | IE]></td><td><![endif]-->
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;vertical-align:middle;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                          <tr>
                                            <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                              <a href="https://chat.whatsapp.com/IXrOLV0xWra8DHNqVCmHrj" target="_blank">
                                                <img height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/wa22.png" style="border-radius:3px;display:block;" width="25" />
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <!--[if mso | IE]></td></tr></table><![endif]-->
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:14px;font-weight:200;line-height:1;text-align:left;color:#000000;">Copyright \xA9 2024 Trader App, All rights reserved.</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </div>
</body>

</html>
`;
var transaction_notification_template_default = transactionNotificationTemplate;

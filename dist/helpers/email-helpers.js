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

// src/helpers/email-helpers.ts
var email_helpers_exports = {};
__export(email_helpers_exports, {
  formatEmailMessageBody: () => formatEmailMessageBody
});
module.exports = __toCommonJS(email_helpers_exports);

// src/templates/email-templates/create-user-template.ts
var createUserTemplate = `<!doctype html>
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
                                <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:1;text-align:left;color:#000000;">Welcome to TraderApp</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:300;line-height:1;text-align:left;color:#000000;">Hi {USER_NAME},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">We&apos;re excited to welcome you to Trader App and we&apos;re even more excited about what we&apos;ve got planned. You&apos;re already on your way to building a well structured finance.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">Click the button below to quickly reset your password and login into your account.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" vertical-align="middle" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tr>
                                      <td align="center" bgcolor="#1836B2" role="presentation" style="border:none;border-radius:6px;cursor:auto;mso-padding-alt:10px 25px;background:#1836B2;" valign="middle">
                                        <a href="{RESET_LINK}" style="display:inline-block;background:#1836B2;color:#ffffff;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:6px;" target="_blank"> Reset Password </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:0;text-align:left;color:#000000;">Have any question? Reach out to us on <mj-text href="#">here.</mj-text>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:0px;word-break:break-word;">
                                  <div style="height:20px;line-height:20px;">&#8202;</div>
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

</html>`;
var create_user_template_default = createUserTemplate;

// src/templates/email-templates/general.ts
var generalTemplate = `<!doctype html>
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
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Hi {USER_NAME}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">{BODY}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Thanks,</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:0;text-align:left;color:#000000;">TraderApp Team.</div>
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

</html>`;
var general_default = generalTemplate;

// src/templates/email-templates/get-started-template.ts
var getStartedTemplate = `
<!doctype html>
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
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">We&apos;re excited to welcome you to Trader App and we&apos;re even more excited about what we&apos;ve got planned. You&apos;re already on your way to building a well structured finance.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">Whether you\u2019re here for your brand, for a cause, or just for fun \u2014 welcome! If there\u2019s anything you need, we\u2019ll be here every step of the way.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">Thanks for signing up. If you have any questions, send us a message at support@traderapp.finance or on any of our social media platforms. We\u2019d love to hear from you.</div>
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
var get_started_template_default = getStartedTemplate;

// src/templates/email-templates/otp.ts
var otpTemplate = `<!doctype html>
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
                                  <table cellpadding="0" cellspacing="0" width="100%" border="0" style="color:#000000;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;line-height:22px;table-layout:auto;width:100%;border:none;">
                                    <tr style="text-align:left;padding:15px 0;">
                                      <th style="padding: 5px 5px; font-size: 24px; letter-spacing: 5px;background: #F1F4FF; border-radius: 10px; color: #102477; width: 120px; text-align: center;">{OTP}</th>
                                      <th style="padding: 0 15px 0 0;background: #ffffff; opacity: 0"></th>
                                      <th style="padding: 0 15px 0 0;background: #ffffff; opacity: 0"></th>
                                      <th style="padding: 0 15px 0 0;background: #ffffff; opacity: 0"></th>
                                      <th style="padding: 0 15px 0 0;background: #ffffff; opacity: 0"></th>
                                      <th style="padding: 0 15px 0 0;background: #ffffff; opacity: 0"></th>
                                      <th style="padding: 0 15px 0 0;background: #ffffff; opacity: 0"></th>
                                    </tr>
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
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">A new action was taken on your TraderApp account. To authorise this action, please use the OTP code above. This code expires after 10 minutes.</div>
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

</html>`;
var otp_default = otpTemplate;

// src/templates/email-templates/password-reseet-template.ts
var passwordResetTemplate = `<!doctype html>
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
                                <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:1;text-align:center;color:#000000;">Let\u2019s reset your password</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:300;line-height:1;text-align:left;color:#000000;">Hi {USER_NAME}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">Looks likes you forgot your password, No Worries, it happens. click the button below to quickly reset your password</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" vertical-align="middle" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tr>
                                      <td align="center" bgcolor="#1836B2" role="presentation" style="border:none;border-radius:6px;cursor:auto;mso-padding-alt:10px 25px;background:#1836B2;" valign="middle">
                                        <a href="{RESET_LINK}" style="display:inline-block;background:#1836B2;color:#ffffff;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:6px;" target="_blank"> Reset Password </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:1.5;text-align:left;color:#000000;">If you didn&apos;t request a password reset please just ignore this email.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:16px;font-weight:200;line-height:0;text-align:left;color:#000000;">Have any question? Reach out to us on <mj-text href="#">here.</mj-text>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:0px;word-break:break-word;">
                                  <div style="height:20px;line-height:20px;">&#8202;</div>
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

</html>`;
var password_reseet_template_default = passwordResetTemplate;

// src/templates/email-templates/referral.ts
var template = `<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>TraderApp</title>
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
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600" rel="stylesheet" type="text/css">
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800);
    @import url(https://fonts.googleapis.com/css2?family=Outfit:wght@600);

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
    @media only screen and (max-width:479px) {
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

    .header-logo {
      background: #1836B2;
      border-radius: 435.75px;
    }

    .blue-button {
      background-color: #1836B2;
      border-radius: 8px;
      box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    }

    .benefits-section {
      background: #EEF1FE;
      border: 3px solid #1836B2;
      border-radius: 8px;
    }

    @media (max-width: 480px) {
      .header-text {
        font-size: 16px !important;
      }

      .body-text {
        font-size: 14px !important;
      }
    }

  </style>
</head>

<body style="word-spacing:normal;background-color:white;">
  <div style="background-color:white;" lang="und" dir="auto">
    <!-- Header Section -->
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;padding-top:40px;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <tr>
                      <td align="center" class="header-logo" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                          <tbody>
                            <tr>
                              <td style="width:80px;">
                                <img alt="" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="80" height="auto" />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:Outfit;font-size:40px;font-weight:600;line-height:1;text-align:center;color:#1D5BD6;">TraderApp</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" class="header-text" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:Manrope;font-size:20px;font-weight:500;line-height:29px;text-align:center;color:#08123B;">Join TraderApp Early & Get 90% Off\u2014Unlock Consistent Profits Today! \u{1F680}\u{1F4B0}</div>
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
    <!--[if mso | IE]></td></tr></table><![endif]-->
    <!-- Main Wrapper -->
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="br_20-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div class="br_20" style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:36px;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:528px;" width="528" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:528px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:528px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:24px;font-weight:800;line-height:1;text-align:left;color:#08123B;">Hi \u{1F44B}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="body-text" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:20px;font-weight:400;line-height:33px;text-align:left;color:#08123B;">I've got something exciting to share! I've been using <b>TraderApp</b>, a copy trading platform that makes it incredibly easy for anyone to succeed in crypto and forex trading, with or without experience.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="body-text" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:20px;font-weight:400;line-height:33px;text-align:left;color:#08123B;">With TraderApp, you're not just trading\u2014you're copying the best strategies from top experts in the field. The platform automatically replicates these winning trades in your account, ensuring you can maximize profits and keep them consistent over time. No need to analyze markets or worry about when to enter or exit trades\u2014TraderApp does all the hard work for you!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" class="blue-button" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#414141" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#414141;" valign="middle">
                                          <a href="{REFERRAL_LINK}" style="display:inline-block;background:#414141;color:#ffffff;font-family:Inter;font-size:16px;font-weight:500;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;" target="_blank"> Signup to TraderApp </a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;padding-top:30px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:24px;font-weight:800;line-height:1;text-align:left;color:#08123B;">Here's why you should join now \u{1F604}</div>
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
              <!--[if mso | IE]></td></tr></table></td></tr><![endif]-->
              <!-- Benefits Section -->
              <!--[if mso | IE]><tr><td class="benefits-section-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="benefits-section-outlook" role="presentation" style="width:528px;" width="528" bgcolor="#EEF1FE" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div class="benefits-section" style="background:#EEF1FE;background-color:#EEF1FE;margin:0px auto;max-width:528px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#EEF1FE;background-color:#EEF1FE;width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:528px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" class="body-text" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:16px;font-weight:500;line-height:29px;text-align:left;color:#08123B;">\u2022 Exclusive Signals Access: Start trading immediately with expert-curated signals designed to help you make profitable trades in your own account.<br /><br /> \u2022 Build Your Community Early: Get a head start by inviting others, completing tasks, and accumulating referral rewards and task points before the full launch.<br /><br /> \u2022 Stay in Control: Your funds remain secure in your external trading account\u2014TraderApp has no access to them.<br /><br /> \u2022 Future-Proof Your Trading: Our copy trading feature is on the way. As an early adopter, you'll be first in line to benefit.</div>
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
              <!--[if mso | IE]></td></tr></table></td></tr><![endif]-->
              <!-- How to Get Started -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:528px;" width="528" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:528px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:528px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;padding-top:30px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:24px;font-weight:800;line-height:1;text-align:left;color:#08123B;">Here's how to get started \u{1F92D}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="body-text" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:20px;font-weight:500;line-height:29px;text-align:left;color:#08123B;">1. Sign Up: Use my referral link to claim your 90% discount<br /> 2. Activate Your Account: For just $10, you'll unlock full access to expert signals<br /> 3. Start Earning: Deposit at least $50 into your external trading account</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;padding-top:30px;word-break:break-word;">
                                  <div style="font-family:Manrope;font-size:20px;font-weight:600;line-height:29px;text-align:left;color:#08123B;">Best regards,<br /> {REFERRER}<br /> Proud TraderApp Member</div>
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
    <!-- Footer Section -->
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
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
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                          <tbody>
                            <tr>
                              <td style="padding:4px;vertical-align:middle;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                  <tbody>
                                    <tr>
                                      <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                        <a href="https://x.com/traderapp" target="_blank">
                                          <img alt="" height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="25" />
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                          <tbody>
                            <tr>
                              <td style="padding:4px;vertical-align:middle;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                  <tbody>
                                    <tr>
                                      <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                        <a href="https://www.facebook.com/traderappofficial" target="_blank">
                                          <img alt="" height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="25" />
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                          <tbody>
                            <tr>
                              <td style="padding:4px;vertical-align:middle;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                  <tbody>
                                    <tr>
                                      <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                        <a href="https://instagram.com/traderappinc" target="_blank">
                                          <img alt="" height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="25" />
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                          <tbody>
                            <tr>
                              <td style="padding:4px;vertical-align:middle;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                  <tbody>
                                    <tr>
                                      <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                        <a href="https://traderapp.finance/#" target="_blank">
                                          <img alt="" height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="25" />
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                          <tbody>
                            <tr>
                              <td style="padding:4px;vertical-align:middle;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:25px;">
                                  <tbody>
                                    <tr>
                                      <td style="font-size:0;height:25px;vertical-align:middle;width:25px;">
                                        <a href="https://chat.whatsapp.com/IXrOLV0xWra8DHNqVCmHrj" target="_blank">
                                          <img alt="" height="25" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/wa22.png" style="border-radius:3px;display:block;" width="25" />
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:Manrope;font-size:14px;font-weight:600;line-height:1;text-align:center;color:#0A0D14;">Copyright \xA9 2024 TraderApp,<br /> All rights reserved.</div>
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
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </div>
</body>

</html>`;
var referral_default = template;

// src/templates/email-templates/send-deposit-confirmation-email-template.ts
var SendDepositConfirmationEmailTemplate = `<!doctype html><html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>TraderApp - Deposit Confirmation</title><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style type="text/css">#outlook a { padding:0; }
      body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
      img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
      p { display:block;margin:13px 0; }</style><!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]--><!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]--><style type="text/css">@media only screen and (min-width:480px) {
        .mj-column-per-100 { width:100% !important; max-width: 100%; }
      }</style><style media="screen and (min-width:480px)">.moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }</style><style type="text/css">@media only screen and (max-width:479px) {
      table.mj-full-width-mobile { width: 100% !important; }
      td.mj-full-width-mobile { width: auto !important; }
    }</style></head><body style="word-spacing:normal;background-color:#FFFFFF;"><div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your deposit has been credited successfully.</div><div aria-label="TraderApp - Deposit Confirmation" aria-roledescription="email" style="background-color:#FFFFFF;" role="article" lang="und" dir="auto"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="wrapper-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="wrapper" style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]--><!-- Logo --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:10px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:150px;"><img alt="TraderApp Logo" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Banner --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:236px;"><img alt="Deposit Confirmation Banner" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/Investing+1.png" style="border:0;display:block;outline:none;text-decoration:none;height:236.3px;width:100%;font-size:13px;" width="236" height="236"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Greeting --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="name-text" style="font-family: Manrope; font-weight: 700; line-height: 130%; color: #08123B; font-size: 0px; padding: 0 0 8px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">Hello {USER_NAME},</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Main Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">A deposit transaction has been successfully processed, and the amount of <span class="highlight" style="font-family: Manrope, Arial, sans-serif; font-size: 14px; line-height: 1.6; font-weight: 700; color: #414141;">{AMOUNT} USDT</span> has been credited to your TraderApp account.</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Deposit Details --><!--[if mso | IE]><tr><td class="details-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="details-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="details-box" style="background-color: #F5F8FF; border-radius: 8px; width: auto; box-sizing: border-box; padding: 5px 15px; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:12px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0 0 6px 0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:16px;font-weight:bold;line-height:1.4;text-align:left;color:#454648;">Deposit Details</div></td></tr><!-- Bulletproof line spacing for all platforms --><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#454648;"><p style="margin:0; line-height:2; display:block;"><b>Amount:</b> {AMOUNT} USDT</p><p style="margin:0; line-height:2; display:block;"><b>Date:</b> {DATE_TIME}</p><p style="margin:0; line-height:2; display:block;"><b>Wallet Address:</b> {ADDRESS}</p><p style="margin:0; line-height:2; display:block;"><b>Network Type:</b> {NETWORK}</p><p style="margin:0; line-height:2; display:block;"><b>Transaction ID:</b> {TRANSACTION_ID}</p></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Support Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">You can now explore trading opportunities and take another step toward financial freedom.<br><br>If you did not authorize this deposit or notice any unusual activity, please contact our support team immediately at <a href="mailto:support@traderapp.com" style="color: #1836B2; text-decoration: none;">support@traderapp.com</a>.<br><br>Thank you for trading with TraderApp. We remain committed to helping you achieve your financial goals.</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Closing --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">Warm regards,<br><span class="remarkspan" style="color: #0a0d14; font-family: Manrope; font-weight: 600; font-size: 18px; line-height: 135%;">The TraderApp Team</span></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Social Links --><!--[if mso | IE]><tr><td class="social-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="social-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="social-box" style="background-color: #F5F8FF; width: auto; padding: 20px; box-sizing: border-box; border-radius: 8px; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://x.com/traderapp" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="Twitter" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://www.facebook.com/traderappofficial?mibextid=ZbWKwL" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="Facebook" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://instagram.com/traderapphq" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="Instagram" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://traderapp.finance/#" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="TikTok" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></html>`;
var send_deposit_confirmation_email_template_default = SendDepositConfirmationEmailTemplate;

// src/templates/email-templates/send-trade-activated-notification-template.ts
var SendTradeActivatedNotificationTemplate = `<!doctype html><html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>TraderApp - Active Trade Notification</title><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style type="text/css">#outlook a { padding:0; }
      body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
      img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
      p { display:block;margin:13px 0; }</style><!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]--><!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]--><style type="text/css">@media only screen and (min-width:480px) {
        .mj-column-per-100 { width:100% !important; max-width: 100%; }
      }</style><style media="screen and (min-width:480px)">.moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }</style><style type="text/css">@media only screen and (max-width:479px) {
      table.mj-full-width-mobile { width: 100% !important; }
      td.mj-full-width-mobile { width: auto !important; }
    }</style></head><body style="word-spacing:normal;background-color:#ffffff;"><div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">A new trade has been activated successfully.</div><div aria-label="TraderApp - Active Trade Notification" aria-roledescription="email" style="background-color:#ffffff;" role="article" lang="und" dir="auto"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]--><!-- Logo --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:10px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:150px;"><img alt="TraderApp Logo" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Banner --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:600px;"><img alt="Trade Notification Banner" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/banners+(2).png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="600" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Greeting --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="name-text" style="font-family: Manrope; font-weight: 700; color: #08123b; font-size: 0px; padding: 0 0 8px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Hello {USER_NAME},</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Main Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Your trade on <span class="platform" style="line-height: 1.8; font-family: IBM Plex Sans; font-weight: 600; font-size: 16px; color: #414141;">{BASE_ASSET} / {QUOTE_CURRENCY}</span> <span style="font-family: Manrope, Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 1.8; {TRADE_SIDE_TEXT_COLOR}">({TRADE_SIDE})</span> is now active on your <span class="platform" style="line-height: 1.8; font-family: IBM Plex Sans; font-weight: 600; font-size: 16px; color: #414141;">{PLATFORM_NAME} account</span>. This means that the open order has been filled and the trade has started<br></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Trade Summary --><!--[if mso | IE]><tr><td class="details-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="details-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="details-box" style="background-color: #f5f8ff; border-radius: 8px; padding: 1px 12px; box-sizing: border-box; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="deposit_details" style="font-family: Manrope; font-weight: 700; color: #0A0D14; font-size: 0px; padding: 0 0 12px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Trade Summary</div></td></tr><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.9;text-align:left;color:#454648;"><mj-raw><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px 0;"><tr><!-- LABEL --><td style="vertical-align:middle;"><span class="b" style="font-family: Manrope, Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 1.8; color: #0a0d14;">Asset:</span></td><!-- ICON --><td style="vertical-align:middle; padding-left:10px;"><img src="{BASE_ASSET_LOGO_URL}" alt width="20" height="20" style="display:block; border:0; outline:0;"></td><!-- BASE ASSET --><td style="vertical-align:middle; padding-left:6px;"><span class="baseasset" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; display: inline-flex; align-items: center; font-weight: 700; font-size: 14px; color: #414141; margin-left: 6px;">{BASE_ASSET} / {QUOTE_CURRENCY}</span></td><!-- TRADE SIDE TAG --><td style="vertical-align:middle; padding-left:8px;"><span class="tradeside" style="line-height: 1.8; display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; margin-left: 8px; border-radius: 4px; font-family: Manrope, Arial, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; vertical-align: middle; {TRADE_SIDE_TEXT_COLOR}">{TRADE_SIDE}</span></td></tr></table></mj-raw><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Entry Price:</mj-text><span class="entryprice" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #667085; margin-left: 10px;">{ENTRY_PRICE}</span></p><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Stop Loss:</mj-text><span class="entryprice" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #667085; margin-left: 10px;">{STOP_LOSS}</span></p><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Estimated Loss:</mj-text><span class="estimatedloss" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #ed3b3b; margin-left: 10px;">{ESTIMATED_LOSS} USDT</span></p><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Estimated Profit:</mj-text><span class="estimatedprofit" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #067d55; margin-left: 10px;">{ESTIMATED_PROFIT} USDT</span></p><p style="margin: 0; display: flex; align-items: center;"><mj-text css-class="b">Date:</mj-text><span class="entryprice" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #667085; margin-left: 10px;">{DATE_TIME}</span></p></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Support Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Thanks for choosing TraderApp \u2014 let\u2019s make every trade count!</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Closing --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Warm regards,<br><span class="remarkspan" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; color: #0a0d14; font-weight: 600; font-size: 18px;">The TraderApp Team</span></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Social Links --><!--[if mso | IE]><tr><td class="social-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="social-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="social-box" style="background-color: #f5f8ff; border-radius: 8px; padding: 20px; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://x.com/traderapp" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="Twitter" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://www.facebook.com/traderappofficial?mibextid=ZbWKwL" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="Facebook" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://instagram.com/traderapphq" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="Instagram" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://traderapp.finance/#" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="TikTok" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></html>`;
var send_trade_activated_notification_template_default = SendTradeActivatedNotificationTemplate;

// src/templates/email-templates/send-trade-initiated-notification-template.ts
var SendTradeInitiatedNotificationTemplate = `<!doctype html><html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>TraderApp - New Trade Notification</title><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style type="text/css">#outlook a { padding:0; }
      body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
      img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
      p { display:block;margin:13px 0; }</style><!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]--><!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]--><style type="text/css">@media only screen and (min-width:480px) {
        .mj-column-per-100 { width:100% !important; max-width: 100%; }
      }</style><style media="screen and (min-width:480px)">.moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }</style><style type="text/css">@media only screen and (max-width:479px) {
      table.mj-full-width-mobile { width: 100% !important; }
      td.mj-full-width-mobile { width: auto !important; }
    }</style></head><body style="word-spacing:normal;background-color:#ffffff;"><div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">A new trade has been initiated successfully.</div><div aria-label="TraderApp - New Trade Notification" aria-roledescription="email" style="background-color:#ffffff;" role="article" lang="und" dir="auto"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]--><!-- Logo --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:10px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:150px;"><img alt="TraderApp Logo" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Banner --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:600px;"><img alt="Trade Notification Banner" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/banners+(2).png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="600" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Greeting --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="name-text" style="font-family: Manrope; font-weight: 700; color: #08123b; font-size: 0px; padding: 0 0 8px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Hello {USER_NAME},</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Main Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">A new trade has just been copied to your <span class="platform" style="line-height: 1.8; font-family: IBM Plex Sans; font-weight: 600; font-size: 16px; color: #414141;">{PLATFORM_NAME} account</span>. Below are the trade details for your reference.<br><br>Please note that the trade has only been initiated and is not active yet. We will notify you once the order has been filled and the trade becomes active.</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Trade Summary --><!--[if mso | IE]><tr><td class="details-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="details-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="details-box" style="background-color: #f5f8ff; border-radius: 8px; padding: 1px 12px; box-sizing: border-box; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="deposit_details" style="font-family: Manrope; font-weight: 700; color: #0A0D14; font-size: 0px; padding: 0 0 12px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Trade Summary</div></td></tr><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.9;text-align:left;color:#454648;"><mj-raw><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px 0;"><tr><!-- LABEL --><td style="vertical-align:middle;"><span class="b" style="font-family: Manrope, Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 1.8; color: #0a0d14;">Asset:</span></td><!-- ICON --><td style="vertical-align:middle; padding-left:10px;"><img src="{BASE_ASSET_LOGO_URL}" alt width="20" height="20" style="display:block; border:0; outline:0;"></td><!-- BASE ASSET --><td style="vertical-align:middle; padding-left:6px;"><span class="baseasset" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; display: inline-flex; align-items: center; font-weight: 700; font-size: 14px; color: #414141; margin-left: 6px;">{BASE_ASSET} / {QUOTE_CURRENCY}</span></td><!-- TRADE SIDE TAG --><td style="vertical-align:middle; padding-left:8px;"><span class="tradeside" style="line-height: 1.8; display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; margin-left: 8px; border-radius: 4px; font-family: Manrope, Arial, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; vertical-align: middle; {TRADE_SIDE_TEXT_COLOR}">{TRADE_SIDE}</span></td></tr></table></mj-raw><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Entry Price:</mj-text><span class="entryprice" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #667085; margin-left: 10px;">{ENTRY_PRICE}</span></p><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Stop Loss:</mj-text><span class="entryprice" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #667085; margin-left: 10px;">{STOP_LOSS}</span></p><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Estimated Loss:</mj-text><span class="estimatedloss" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #ed3b3b; margin-left: 10px;">{ESTIMATED_LOSS} USDT</span></p><p style="margin: 0 0 6px 0; display: flex; align-items: center;"><mj-text css-class="b">Estimated Profit:</mj-text><span class="estimatedprofit" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #067d55; margin-left: 10px;">{ESTIMATED_PROFIT} USDT</span></p><p style="margin: 0; display: flex; align-items: center;"><mj-text css-class="b">Date:</mj-text><span class="entryprice" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; font-weight: 500; font-size: 14px; color: #667085; margin-left: 10px;">{DATE_TIME}</span></p></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Support Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Thanks for choosing TraderApp \u2014 let\u2019s make every trade count!</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Closing --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.8;text-align:left;color:#454648;">Warm regards,<br><span class="remarkspan" style="font-family: Manrope, Arial, sans-serif; line-height: 1.8; color: #0a0d14; font-weight: 600; font-size: 18px;">The TraderApp Team</span></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Social Links --><!--[if mso | IE]><tr><td class="social-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="social-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="social-box" style="background-color: #f5f8ff; border-radius: 8px; padding: 20px; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://x.com/traderapp" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="Twitter" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://www.facebook.com/traderappofficial?mibextid=ZbWKwL" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="Facebook" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://instagram.com/traderapphq" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="Instagram" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://traderapp.finance/#" target="_blank" style="color: #1836b2; text-decoration: none;"><img alt="TikTok" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></html>`;
var send_trade_initiated_notification_template_default = SendTradeInitiatedNotificationTemplate;

// src/templates/email-templates/send-withdrawal-confirmation-email-tempate.ts
var sendWithdrawalConfirmationEmailTemplate = `<!doctype html><html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>TraderApp - Withdrawal Successful</title><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style type="text/css">#outlook a { padding:0; }
      body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
      img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
      p { display:block;margin:13px 0; }</style><!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]--><!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]--><style type="text/css">@media only screen and (min-width:480px) {
        .mj-column-per-100 { width:100% !important; max-width: 100%; }
      }</style><style media="screen and (min-width:480px)">.moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }</style><style type="text/css">@media only screen and (max-width:479px) {
      table.mj-full-width-mobile { width: 100% !important; }
      td.mj-full-width-mobile { width: auto !important; }
    }</style></head><body style="word-spacing:normal;background-color:#FFFFFF;"><div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your withdrawal has been processed successfully.</div><div aria-label="TraderApp - Withdrawal Successful" aria-roledescription="email" style="background-color:#FFFFFF;" role="article" lang="und" dir="auto"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]--><!-- Logo --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:10px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:150px;"><img alt="TraderApp Logo" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Banner --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:600px;"><img alt="Withdrawal Confirmation Banner" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/withdrawal+banners+(2).png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="600" height="auto"></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Greeting --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="name-text" style="font-family: Manrope; font-weight: 700; line-height: 130%; color: #08123B; font-size: 0px; padding: 0 0 8px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#0A0D14;">Hello {USER_NAME},</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Main Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="content" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#0A0D14;">We are pleased to inform you that your withdrawal request has been successfully processed from your TraderApp account.</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Withdrawal Details --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:12px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="details-box-outlook" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix details-box" style="background-color: #F5F8FF; border-radius: 8px; padding: 5px 15px; box-sizing: border-box; font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="section-title" style="font-family: Manrope; font-weight: 700; line-height: 150%; color: #0A0D14; margin-bottom: 6px; font-size: 0px; padding: 0 0 6px 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#0A0D14;">Withdrawal Details</div></td></tr><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#0A0D14;"><p><b>Amount:</b> {AMOUNT} USDT</p><p><b>Date:</b> {DATE_TIME}</p><p><b>Wallet Address:</b> {ADDRESS}</p><p><b>Network Type:</b> {NETWORK}</p><p><b>Transaction ID:</b> {TRANSACTION_ID}</p></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Support Message --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="content" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#0A0D14;">Your funds should arrive within a few minutes. You may track the status of your transaction anytime from your TraderApp dashboard.<br><br>If you didn\u2019t initiate this withdrawal or notice any issue, please contact our support team immediately at <a href="mailto:support@traderapp.com" style="color: #1836B2; text-decoration: none;">support@traderapp.com</a>.<br><br>Thank you for trading with TraderApp. We remain committed to helping you achieve your financial goals.</div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Closing --><!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="left" class="remark" style="font-family: Manrope; font-weight: 400; line-height: 135%; color: #414141; font-size: 0px; padding: 0; word-break: break-word;"><div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#0A0D14;">Warm regards,<br><span class="remarkspan" style="color: #0a0d14; font-family: Manrope; font-weight: 600; font-size: 18px; line-height: 135%;">The TraderApp Team</span></div></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- Social Links --><!--[if mso | IE]><tr><td class="social-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="social-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="social-box" style="background-color: #F5F8FF; border-radius: 8px; padding: 20px; box-sizing: border-box; margin: 0px auto; max-width: 600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://x.com/traderapp" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="Twitter" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://www.facebook.com/traderappofficial?mibextid=ZbWKwL" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="Facebook" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://instagram.com/traderapphq" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="Instagram" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td><td><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr><td style="padding:4px;vertical-align:middle;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;"><tbody><tr><td style="font-size:0;height:32px;vertical-align:middle;width:32px;"><a href="https://traderapp.finance/#" target="_blank" style="color: #1836B2; text-decoration: none;"><img alt="TikTok" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="32"></a></td></tr></tbody></table></td></tr></tbody></table><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></html>`;
var send_withdrawal_confirmation_email_tempate_default = sendWithdrawalConfirmationEmailTemplate;

// src/utils/email/color.ts
function getTradeSideColor(side) {
  const TradeSideColor = {
    ["LONG" /* LONG */]: "color:#08875d; background-color:#edfdf8;",
    ["SHORT" /* SHORT */]: "color:#e02d3c; background-color:#fef1f2;"
  };
  return TradeSideColor[side];
}

// src/helpers/email-helpers.ts
var applyReplacements = (template2, replacements) => {
  let result = template2;
  for (const [key, value] of Object.entries(replacements)) {
    if (value) {
      result = result.replace(new RegExp(`{${key}}`, "g"), value);
    }
  }
  return result;
};
var formatEmailMessageBody = ({
  recipient,
  message,
  event,
  sender,
  metadata
}) => {
  switch (event) {
    case "GENERAL" /* GENERAL */:
      return applyReplacements(general_default, {
        USER_NAME: recipient.firstName,
        BODY: message
      });
    case "OTP" /* OTP */:
      return applyReplacements(otp_default, {
        USER_NAME: recipient.firstName,
        OTP: message
      });
    case "RESET_PASSWORD" /* RESET_PASSWORD */:
      return applyReplacements(password_reseet_template_default, {
        USER_NAME: recipient.firstName,
        RESET_LINK: message
      });
    case "CREATE_USER" /* CREATE_USER */:
      return applyReplacements(create_user_template_default, {
        USER_NAME: recipient.firstName,
        RESET_LINK: message
      });
    case "WELCOME" /* WELCOME */:
      return applyReplacements(get_started_template_default, {
        USER_NAME: recipient.firstName
      });
    case "SEND_DEPOSIT_CONFIRMATION_EMAIL" /* SEND_DEPOSIT_CONFIRMATION_EMAIL */: {
      return applyReplacements(send_deposit_confirmation_email_template_default, {
        USER_NAME: recipient.firstName,
        AMOUNT: metadata?.amount?.toString(),
        TRANSACTION_ID: metadata?.transactionId,
        DATE_TIME: metadata?.dateTime,
        NETWORK: metadata?.network,
        ADDRESS: metadata?.address
      });
    }
    case "SEND_WITHDRAWAL_CONFIRMATION_EMAIL" /* SEND_WITHDRAWAL_CONFIRMATION_EMAIL */: {
      return applyReplacements(send_withdrawal_confirmation_email_tempate_default, {
        USER_NAME: recipient.firstName,
        AMOUNT: metadata?.amount?.toString(),
        TRANSACTION_ID: metadata?.transactionId,
        DATE_TIME: metadata?.dateTime,
        ADDRESS: metadata?.address,
        NETWORK: metadata?.network
      });
    }
    case "SEND_TRADE_INITIATED_NOTIFICATION" /* SEND_TRADE_INITIATED_NOTIFICATION */: {
      const tradeSide = metadata?.tradeSide;
      const textColor = getTradeSideColor(tradeSide);
      return applyReplacements(send_trade_initiated_notification_template_default, {
        USER_NAME: recipient.firstName,
        BASE_ASSET: metadata?.baseAsset,
        BASE_ASSET_LOGO_URL: metadata?.baseAssetLogoUrl,
        QUOTE_CURRENCY: metadata?.quoteCurrency,
        ENTRY_PRICE: metadata?.entryPrice?.toString(),
        STOP_LOSS: metadata?.stopLoss?.toString(),
        TRADE_SIDE: tradeSide,
        TRADE_SIDE_TEXT_COLOR: textColor,
        DATE_TIME: metadata?.dateTime,
        ESTIMATED_PROFIT: metadata?.estimatedProfit?.toString(),
        ESTIMATED_LOSS: metadata?.estimatedLoss?.toString(),
        PLATFORM_NAME: metadata?.platformName ? metadata.platformName.charAt(0).toUpperCase() + metadata.platformName.slice(1).toLowerCase() : void 0
      });
    }
    case "SEND_TRADE_ACTIVATED_NOTIFICATION" /* SEND_TRADE_ACTIVATED_NOTIFICATION */: {
      const tradeSide = metadata?.tradeSide;
      const textColor = getTradeSideColor(tradeSide);
      return applyReplacements(send_trade_activated_notification_template_default, {
        USER_NAME: recipient.firstName,
        BASE_ASSET: metadata?.baseAsset,
        BASE_ASSET_LOGO_URL: metadata?.baseAssetLogoUrl,
        QUOTE_CURRENCY: metadata?.quoteCurrency,
        ENTRY_PRICE: metadata?.entryPrice?.toString(),
        STOP_LOSS: metadata?.stopLoss?.toString(),
        TRADE_SIDE: tradeSide,
        TRADE_SIDE_TEXT_COLOR: textColor,
        DATE_TIME: metadata?.dateTime,
        ESTIMATED_PROFIT: metadata?.estimatedProfit?.toString(),
        ESTIMATED_LOSS: metadata?.estimatedLoss?.toString(),
        PLATFORM_NAME: metadata?.platformName ? metadata.platformName.charAt(0).toUpperCase() + metadata.platformName.slice(1).toLowerCase() : void 0
      });
    }
    case "INVITE_USER" /* INVITE_USER */:
      return applyReplacements(referral_default, {
        REFERRAL_LINK: message,
        REFERRER: `${sender?.firstName ?? ""} ${sender?.lastName ?? ""}`
      });
    default:
      throw new Error(`No email event with name ${event}`);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatEmailMessageBody
});

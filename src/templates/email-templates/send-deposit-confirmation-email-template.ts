const SendDepositConfirmationEmailTemplate = `<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>TraderApp - Deposit Confirmation</title>
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
</head>

<body style="word-spacing:normal;background-color:#FFFFFF;">
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your deposit has been credited successfully.</div>
  <div aria-label="TraderApp - Deposit Confirmation" aria-roledescription="email" style="background-color:#FFFFFF;" role="article" lang="und" dir="auto">
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="wrapper-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div class="wrapper" style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]-->
              <!-- Logo -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:10px;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                                    <tbody>
                                      <tr>
                                        <td style="width:150px;">
                                          <img alt="TraderApp Logo" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/traderapp-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150" height="auto">
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
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
              <!-- Banner -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                                    <tbody>
                                      <tr>
                                        <td style="width:236px;">
                                          <img alt="Deposit Confirmation Banner" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/Investing+1.png" style="border:0;display:block;outline:none;text-decoration:none;height:236.3px;width:100%;font-size:13px;" width="236" height="236">
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
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
              <!-- Greeting -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" class="name-text" style="font-family: Manrope; font-weight: 700; line-height: 130%; color: #08123B; font-size: 0px; padding: 0 0 8px 0; word-break: break-word;">
                                  <div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">Hello {USER_NAME},</div>
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
              <!-- Main Message -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">A deposit transaction has been successfully processed, and the amount of <span class="highlight" style="font-family: Manrope, Arial, sans-serif; font-size: 14px; line-height: 1.6; font-weight: 700; color: #414141;">{AMOUNT} USDT</span> has been credited to your TraderApp account.</div>
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
              <!-- Deposit Details -->
              <!--[if mso | IE]><tr><td class="details-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="details-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div class="details-box" style="background-color: #F5F8FF; border-radius: 8px; width: auto; box-sizing: border-box; padding: 5px 15px; margin: 0px auto; max-width: 600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:12px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:0 0 6px 0;word-break:break-word;">
                                  <div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:16px;font-weight:bold;line-height:1.4;text-align:left;color:#454648;">Deposit Details</div>
                                </td>
                              </tr>
                              <!-- Bulletproof line spacing for all platforms -->
                              <tr>
                                <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.6;text-align:left;color:#454648;">
                                    <p style="margin:0; line-height:2; display:block;">
                                      <b>Amount:</b> {AMOUNT} USDT
                                    </p>
                                    <p style="margin:0; line-height:2; display:block;">
                                      <b>Date:</b> {DATE_TIME}
                                    </p>
                                    <p style="margin:0; line-height:2; display:block;">
                                      <b>Wallet Address:</b> {ADDRESS}
                                    </p>
                                    <p style="margin:0; line-height:2; display:block;">
                                      <b>Network Type:</b> {NETWORK}
                                    </p>
                                    <p style="margin:0; line-height:2; display:block;">
                                      <b>Transaction ID:</b> {TRANSACTION_ID}
                                    </p>
                                  </div>
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
              <!-- Support Message -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:16px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">You can now explore trading opportunities and take another step toward financial freedom. <br><br> If you did not authorize this deposit or notice any unusual activity, please contact our support team immediately at <a href="mailto:support@traderapp.com" style="color: #1836B2; text-decoration: none;">support@traderapp.com</a>. <br><br> Thank you for trading with TraderApp. We remain committed to helping you achieve your financial goals.</div>
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
              <!-- Closing -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:0 0 16px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:IBM Plex Sans, Arial, sans-serif;font-size:14px;line-height:1.4;text-align:left;color:#454648;">Warm regards,<br>
                                    <span class="remarkspan" style="color: #0a0d14; font-family: Manrope; font-weight: 600; font-size: 18px; line-height: 135%;">The TraderApp Team</span>
                                  </div>
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
              <!-- Social Links -->
              <!--[if mso | IE]><tr><td class="social-box-outlook" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="social-box-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div class="social-box" style="background-color: #F5F8FF; width: auto; padding: 20px; box-sizing: border-box; border-radius: 8px; margin: 0px auto; max-width: 600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                  <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:4px;vertical-align:middle;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;">
                                            <tbody>
                                              <tr>
                                                <td style="font-size:0;height:32px;vertical-align:middle;width:32px;">
                                                  <a href="https://x.com/traderapp" target="_blank" style="color: #1836B2; text-decoration: none;">
                                                    <img alt="Twitter" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/twitter22.png" style="border-radius:3px;display:block;" width="32">
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
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;">
                                            <tbody>
                                              <tr>
                                                <td style="font-size:0;height:32px;vertical-align:middle;width:32px;">
                                                  <a href="https://www.facebook.com/traderappofficial?mibextid=ZbWKwL" target="_blank" style="color: #1836B2; text-decoration: none;">
                                                    <img alt="Facebook" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/facebook22.png" style="border-radius:3px;display:block;" width="32">
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
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;">
                                            <tbody>
                                              <tr>
                                                <td style="font-size:0;height:32px;vertical-align:middle;width:32px;">
                                                  <a href="https://instagram.com/traderapphq" target="_blank" style="color: #1836B2; text-decoration: none;">
                                                    <img alt="Instagram" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/ig22.png" style="border-radius:3px;display:block;" width="32">
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
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:32px;">
                                            <tbody>
                                              <tr>
                                                <td style="font-size:0;height:32px;vertical-align:middle;width:32px;">
                                                  <a href="https://traderapp.finance/#" target="_blank" style="color: #1836B2; text-decoration: none;">
                                                    <img alt="TikTok" height="32" src="https://traderapp-assets.s3.eu-west-1.amazonaws.com/email/tiktok22.png" style="border-radius:3px;display:block;" width="32">
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

export default SendDepositConfirmationEmailTemplate;

export const SendEmailTemplate = `
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
      <p>Your transaction of <span class="highlight">₦{AMOUNT}</span> was successful.</p>
      <p>Reference ID: <span class="highlight">{REF}</span></p>
      <p>If you didn’t make this transaction, please contact our support team immediately.</p>
      <div class="footer">
        <p>Thanks for using our service,</p>
        <p><strong>The Support Team</strong></p>
      </div>
    </div>
  </body>
</html>
`;
export default SendEmailTemplate;

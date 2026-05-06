const Brevo = require("@getbrevo/brevo");

const client = Brevo.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const transactionalApi = new Brevo.TransactionalEmailsApi();

async function sendOTPEmail(to, otp, purpose = "verification") {
  const email = new Brevo.SendSmtpEmail();

  email.sender = { name: "AskAI", email: process.env.EMAIL_USER };
  email.to = [{ email: to }];
  email.subject = `Your ${purpose} code — AskAI`;
  email.htmlContent = `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#0d0d0d;color:#e8e8e8;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:inline-flex;align-items:center;justify-content:center;font-size:20px;margin:0 auto;">✦</div>
        <h2 style="margin:12px 0 4px;color:#fff;">AskAI</h2>
      </div>
      <p style="color:#aaa;margin-bottom:24px;">Your ${purpose} code is:</p>
      <div style="text-align:center;background:#1a1a1a;border-radius:8px;padding:20px;letter-spacing:8px;font-size:32px;font-weight:700;color:#8b5cf6;">
        ${otp}
      </div>
      <p style="color:#555;font-size:12px;margin-top:20px;text-align:center;">
        This code expires in 10 minutes. Do not share it with anyone.
      </p>
    </div>
  `;

  await transactionalApi.sendTransacEmail(email);
}

module.exports = { sendOTPEmail };

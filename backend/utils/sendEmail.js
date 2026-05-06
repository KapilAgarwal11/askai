const nodemailer = require("nodemailer");

async function sendOTPEmail(to, otp, purpose = "verification") {
  // Create transporter with Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"AskAI" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Your ${purpose} code — AskAI`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#111;color:#e8e8e8;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#8b5cf6;">✦ AskAI</h2>
        </div>
        <p style="color:#aaa;margin-bottom:24px;">Your ${purpose} code is:</p>
        <div style="text-align:center;background:#1a1a1a;border-radius:8px;padding:20px;letter-spacing:8px;font-size:32px;font-weight:700;color:#8b5cf6;">
          ${otp}
        </div>
        <p style="color:#555;font-size:12px;margin-top:20px;text-align:center;">
          Expires in 10 minutes. Do not share it.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };

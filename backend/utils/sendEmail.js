async function sendOTPEmail(to, otp, purpose = "verification") {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "AskAI", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject: `Your ${purpose} code — AskAI`,
      htmlContent: `
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
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Brevo API error");
  }
}

module.exports = { sendOTPEmail };

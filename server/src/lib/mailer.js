const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function otpEmailHtml(code, purpose) {
  const heading = purpose === 'password_reset' ? 'Reset your password' : 'Verify your email';
  const body =
    purpose === 'password_reset'
      ? 'Use this code to reset your Ledger password. It expires in 10 minutes.'
      : 'Use this code to verify your email and activate your Ledger account. It expires in 10 minutes.';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #F5F5F7;">
      <table cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td style="width: 48px; height: 48px; border-radius: 12px; background: #0B6E4F; text-align: center; vertical-align: middle;">
            <span style="color: #F2ECDD; font-size: 22px; font-weight: bold; line-height: 48px;">L</span>
          </td>
        </tr>
      </table>
      <h2 style="color: #1D1D1F; font-size: 20px; font-weight: 500; margin: 0 0 8px;">${heading}</h2>
      <p style="color: #6E6E73; font-size: 14px; margin: 0 0 24px;">${body}</p>
      <div style="background: #FFFFFF; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 32px; font-weight: 600; letter-spacing: 6px; color: #0B6E4F;">${code}</span>
      </div>
      <p style="color: #A1A1A6; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

async function sendOtpEmail(to, code, purpose) {
  const subject = purpose === 'password_reset' ? 'Your Ledger password reset code' : 'Verify your Ledger account';

  await axios.post(
    BREVO_API_URL,
    {
      sender: { name: 'Ledger', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: otpEmailHtml(code, purpose),
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );
}

module.exports = { sendOtpEmail };
// Helper to send real emails via Nodemailer (Gmail SMTP) or Resend
// Fail fast instead of hanging for minutes when Gmail is slow or unreachable
const SMTP_TIMEOUTS = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 };

export async function sendRealEmail(toEmail: string, subject: string, htmlContent: string, textContent?: string): Promise<{ sent: boolean; provider: string; error?: string }> {
  const smtpUser = (process.env.SMTP_USER || 'commonbrewtaytay@gmail.com').trim();
  const rawPass = process.env.SMTP_PASS || '';
  const smtpPass = rawPass.replace(/\s+/g, '');

  const plainText = textContent || htmlContent.replace(/<[^>]+>/g, '').trim();
  let lastError = '';

  
  // Gmail API over HTTPS: works on hosts that block SMTP ports (e.g. Render free instances)
  const gmailClientId = (process.env.GMAIL_CLIENT_ID || '').trim();
  const gmailClientSecret = (process.env.GMAIL_CLIENT_SECRET || '').trim();
  const gmailRefreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim();
  if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: gmailClientId,
          client_secret: gmailClientSecret,
          refresh_token: gmailRefreshToken,
          grant_type: 'refresh_token'
        }),
        signal: AbortSignal.timeout(15000)
      });
      const tokenData: any = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(`token refresh failed: ${tokenData.error_description || tokenData.error || tokenRes.statusText}`);
      }

      // Build the raw MIME message with nodemailer, then hand it to the Gmail API
      const nodemailer = await import('nodemailer');
      const composer = nodemailer.default.createTransport({ streamTransport: true, buffer: true });
      const built: any = await composer.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject,
        text: plainText,
        html: htmlContent
      });

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`
        },
        body: JSON.stringify({ raw: Buffer.from(built.message).toString('base64url') }),
        signal: AbortSignal.timeout(15000)
      });
      const sendData: any = await sendRes.json().catch(() => ({}));
      if (sendRes.ok) {
        console.log(`[Gmail API Success] Email delivered to ${toEmail}. Message ID: ${sendData.id}`);
        return { sent: true, provider: 'CommonBrew Gmail (API)' };
      }
      throw new Error(sendData.error?.message || sendRes.statusText);
    } catch (e: any) {
      lastError = `Gmail API: ${e.message || e}`;
      console.error('[Gmail API Failed]', lastError);
    }
  }


  if (smtpUser && smtpPass) {
    const nodemailer = await import('nodemailer');

    // Strategy A: Direct SMTP port 587 (Standard STARTTLS - works best on Cloud Run)
    try {
      const transporter587 = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        ...SMTP_TIMEOUTS,
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter587.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject: subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[Gmail SMTP 587 Success] Verification email delivered to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'CommonBrew Gmail (SMTP 587)' };
    } catch (e: any) {
      lastError = e.message || String(e);
      console.warn('[Gmail SMTP 587 Failed, trying service: gmail]', e.message || e);
    }

    // Strategy B: Nodemailer service 'gmail'
    try {
      const transporterGmail = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        ...SMTP_TIMEOUTS
      });

      const info = await transporterGmail.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject: subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[Gmail Service Success] Verification email delivered to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'CommonBrew Gmail' };
    } catch (e: any) {
      lastError = e.message || String(e);
      console.warn('[Gmail Service Failed, trying port 465]', e.message || e);
    }

    // Strategy C: Direct SMTP port 465 (SSL)
    try {
      const transporter465 = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        ...SMTP_TIMEOUTS,
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter465.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject: subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[Gmail SMTP 465 Success] Verification email delivered to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'CommonBrew Gmail (SMTP 465)' };
    } catch (e: any) {
      lastError = e.message || String(e);
      console.error('[Gmail SMTP 465 Failed]', e.message || e);
    }
  }

  // Fallback: Resend API (Note: Resend free tier restricts recipient to verified email)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim()) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey.trim()}`
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'CommonBrew Taytay <onboarding@resend.dev>',
          to: [toEmail],
          subject: subject,
          text: plainText,
          html: htmlContent
        })
      });
      const data = await resendRes.json();
      if (resendRes.ok && data.id) {
        console.log(`[Resend Email Sent] Delivered to ${toEmail}:`, data.id);
        return { sent: true, provider: 'Resend API' };
      } else {
        const resendErr = data.message || (typeof data === 'object' ? JSON.stringify(data) : 'Resend error');
        console.error('[Resend API Error]', resendErr);
        if (!lastError) lastError = resendErr;
      }
    } catch (e: any) {
      console.error('[Resend Exception]', e);
    }
  }

  return {
    sent: false,
    provider: 'None',
    error: lastError || 'Unable to send email via Gmail SMTP.'
  };
}


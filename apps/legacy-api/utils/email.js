const nodemailer = require('nodemailer');

let transporter = null;

const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP nie skonfigurowane – pomijam wysyłkę maili.');
    return null;
  }

  console.log('Konfiguruję SMTP transporter', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

exports.sendInviteEmail = async ({ to, inviteUrl, invitedBy }) => {
  const t = getTransporter();
  if (!t) {
    console.warn('⚠️  Brak transportera SMTP – nie wysyłam maila z zaproszeniem.');
    console.warn('💡 Skonfiguruj zmienne SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS w pliku .env');
    return { success: false, error: 'SMTP nie skonfigurowane' };
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'no-reply@kadryhr.pl';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Zaproszenie do KadryHR</h1>
        </div>
        <div class="content">
          <p>Cześć!</p>
          <p>Zostałeś/zostałaś zaproszony(a) do panelu <strong>KadryHR</strong>${
            invitedBy ? ` przez <strong>${invitedBy}</strong>` : ''
          }.</p>
          <p>Aby dokończyć rejestrację i uzyskać dostęp do systemu, kliknij w poniższy przycisk:</p>
          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button" target="_blank" rel="noopener noreferrer">Dokończ rejestrację</a>
          </p>
          <p style="font-size: 14px; color: #64748b;">Lub skopiuj i wklej ten link do przeglądarki:</p>
          <p style="font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;">${inviteUrl}</p>
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Jeśli nie spodziewałeś/aś się tego zaproszenia, możesz zignorować tę wiadomość.</p>
        </div>
        <div class="footer">
          <p>© 2025 KadryHR. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎉 Zaproszenie do KadryHR

Cześć!

Zostałeś/zostałaś zaproszony(a) do panelu KadryHR${
    invitedBy ? ` przez ${invitedBy}` : ''
  }.

Aby dokończyć rejestrację, wejdź w ten link:
${inviteUrl}

Jeśli nie spodziewałeś/aś się tego zaproszenia, możesz zignorować tę wiadomość.

---
© 2025 KadryHR. Wszystkie prawa zastrzeżone.
  `.trim();

  try {
    console.log(`📧 Wysyłanie zaproszenia do: ${to}`);
    const info = await t.sendMail({
      from,
      to,
      subject: '🎉 Zaproszenie do panelu KadryHR',
      text,
      html,
    });

    console.log(`✅ Wysłano mail z zaproszeniem do: ${to}`, {
      messageId: info.messageId,
      response: info.response,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Błąd wysyłki maila z zaproszeniem:', err.message);
    console.error('Szczegóły błędu:', err);
    throw err;
  }
};

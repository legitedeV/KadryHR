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
    console.warn('Brak transportera SMTP – nie wysyłam maila z zaproszeniem.');
    return;
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'no-reply@kadryhr.pl';

  const html = `
    <p>Cześć,</p>
    <p>Zostałeś/zostałaś zaproszony(a) do panelu <strong>KadryHR</strong>${
      invitedBy ? ` przez <strong>${invitedBy}</strong>` : ''
    }.</p>
    <p>Aby dokończyć rejestrację, kliknij w poniższy link:</p>
    <p><a href="${inviteUrl}" target="_blank" rel="noopener noreferrer">${inviteUrl}</a></p>
    <p>Jeśli nie spodziewałeś/aś się tego zaproszenia, możesz zignorować tę wiadomość.</p>
  `;

  const text = `
Cześć,

Zostałeś/zostałaś zaproszony(a) do panelu KadryHR${
    invitedBy ? ` przez ${invitedBy}` : ''
  }.

Aby dokończyć rejestrację, wejdź w ten link:
${inviteUrl}

Jeśli nie spodziewałeś/aś się tego zaproszenia, możesz zignorować tę wiadomość.
  `.trim();

  try {
    const info = await t.sendMail({
      from,
      to,
      subject: 'Zaproszenie do panelu KadryHR',
      text,
      html,
    });

    console.log(`Wysłano mail z zaproszeniem do: ${to}`, {
      messageId: info.messageId,
      response: info.response,
    });
  } catch (err) {
    console.error('Błąd wysyłki maila z zaproszeniem:', err);
    throw err;
  }
};

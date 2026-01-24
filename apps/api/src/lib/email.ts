type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<void>;
}

class PostmarkProvider implements EmailProvider {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Postmark-Server-Token': this.apiKey,
      },
      body: JSON.stringify({
        From: this.from,
        To: payload.to,
        Subject: payload.subject,
        HtmlBody: payload.html,
        TextBody: payload.text,
        MessageStream: 'outbound',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Postmark error: ${response.status} ${errorText}`);
    }
  }
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(payload: EmailPayload): Promise<void> {
    console.log('Email payload:', payload);
  }
}

export function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
  const from = process.env.EMAIL_FROM || 'no-reply@kadryhr.pl';

  if (provider === 'postmark') {
    if (!process.env.EMAIL_API_KEY) {
      throw new Error('EMAIL_API_KEY is required for Postmark');
    }
    return new PostmarkProvider(process.env.EMAIL_API_KEY, from);
  }

  return new ConsoleEmailProvider();
}

export function buildPasswordResetEmail(to: string, resetUrl: string): EmailPayload {
  const subject = 'Reset hasła do KadryHR';
  const text = `Aby zresetować hasło, otwórz link: ${resetUrl}`;
  const html = `
    <p>Otrzymaliśmy prośbę o reset hasła do KadryHR.</p>
    <p><a href="${resetUrl}">Kliknij tutaj, aby zresetować hasło</a></p>
    <p>Jeśli to nie Ty, zignoruj tę wiadomość.</p>
  `;

  return {
    to,
    subject,
    html,
    text,
  };
}

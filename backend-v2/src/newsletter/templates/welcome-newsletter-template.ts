export function buildWelcomeNewsletterHtml(input: {
  unsubscribeUrl: string;
  ctaUrl: string;
}) {
  const { unsubscribeUrl, ctaUrl } = input;
  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KadryHR – newsletter</title>
    <style>
      body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: #f4f6fb; color: #0f172a; }
      a { color: #0f766e; }
      .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 70px rgba(15, 23, 42, 0.08); }
      .hero { background: linear-gradient(135deg, #0ea5e9, #0ea5e9 40%, #0f172a); color: #fff; padding: 32px; }
      .badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 12px; letter-spacing: 0.4px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); }
      .content { padding: 28px; }
      .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #f8fafc; }
      .cta { display: inline-block; background: #0ea5e9; color: #fff; padding: 12px 22px; border-radius: 999px; font-weight: 700; text-decoration: none; }
      .section-title { margin: 0 0 12px; font-size: 18px; }
      .footer { color: #475569; font-size: 13px; padding: 18px 28px 32px; }
      @media (max-width: 640px) { .hero, .content { padding: 20px; } }
    </style>
  </head>
  <body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <div class="container">
            <div class="hero">
              <div class="badge">Nowy subskrybent newslettera</div>
              <h1 style="margin: 16px 0 8px; font-size: 28px;">Witaj w KadryHR!</h1>
              <p style="margin: 0; max-width: 500px; line-height: 1.6;">
                Dziękujemy, że dołączyłeś do naszego newslettera. Przygotowaliśmy krótki przegląd funkcji, które pomagają zespołom sklepów i gastro układać grafik bez chaosu.
              </p>
            </div>
            <div class="content">
              <div class="card" style="margin-bottom: 16px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #0ea5e9; font-weight: 700;">Co nowego w KadryHR?</p>
                <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
                  <li><strong>Grafiki z widokiem mobilnym</strong> – planuj tydzień pracy, a ekipa widzi zmiany na telefonie bez logowania do komputera.</li>
                  <li><strong>Wnioski urlopowe i zamiany zmian</strong> – akceptujesz lub odrzucasz jednym kliknięciem, z automatycznym powiadomieniem mailowym.</li>
                  <li><strong>Powiadomienia o brakach obsady</strong> – KadryHR podpowiada, gdzie w grafiku brakuje ludzi i przypomina pracownikom o nadchodzących zmianach.</li>
                </ul>
              </div>
              <div class="card" style="margin-bottom: 16px; background:#e0f2fe; border-color:#bae6fd;">
                <p style="margin:0 0 8px; font-weight:700; color:#0f172a;">Jak zacząć?</p>
                <p style="margin:0 0 12px; line-height:1.6;">Zaloguj się do panelu i zobacz demo grafiku, wnioski urlopowe oraz szybkie wysyłanie powiadomień do pracowników.</p>
                <a href="${ctaUrl}" class="cta">Zobacz w panelu KadryHR</a>
              </div>
              <div class="card">
                <p style="margin:0 0 6px; font-weight:700;">Masz pytania?</p>
                <p style="margin:0; line-height:1.6;">Odpowiedz na tego maila, a pomożemy z wdrożeniem lub importem pracowników.</p>
              </div>
            </div>
            <div class="footer">
              <p style="margin:0 0 6px;">KadryHR Sp. z o.o., ul. Kadrowa 1, 00-000 Warszawa</p>
              <p style="margin:0 0 6px;">Otrzymujesz tę wiadomość, ponieważ zapisałeś się na newsletter KadryHR.</p>
              <p style="margin:0;">Jeśli nie chcesz otrzymywać podobnych maili, <a href="${unsubscribeUrl}">wypisz się tutaj</a>.</p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

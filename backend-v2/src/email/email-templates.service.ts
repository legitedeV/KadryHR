import { Injectable } from '@nestjs/common';

/**
 * Standardized email templates for KadryHR notifications.
 * All templates are mobile-friendly, dark/light mode safe, and branded.
 */
@Injectable()
export class EmailTemplatesService {
  /**
   * Base HTML wrapper with KadryHR branding
   */
  private baseTemplate(content: string, previewText?: string): string {
    const preview = previewText
      ? `<span style="display:none;font-size:1px;color:#0b1411;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>`
      : '';

    return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>KadryHR</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: dark;
      supported-color-schemes: dark;
    }
    .email-bg {
      background-color: #0b1411;
      background-image: radial-gradient(circle at top, rgba(30, 165, 116, 0.25), transparent 55%);
    }
    .email-card {
      background-color: #111c18;
      border: 1px solid #0f5341;
      border-radius: 18px;
      box-shadow: 0 20px 45px rgba(2, 6, 23, 0.45);
    }
    .email-text { color: #e4f2ea; }
    .email-text-secondary { color: #b2ebcc; }
    .email-text-muted { color: #7fbfa5; }
    .email-divider { border-color: #1f3b31; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b1411;font-family:'Inter','SF Pro Display','Segoe UI',system-ui,-apple-system,sans-serif;">
  ${preview}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-bg" style="background-color:#0b1411;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
          <!-- Logo Header -->
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background-color:rgba(15,83,65,0.4);border:1px solid rgba(30,165,116,0.35);">
                <span style="width:8px;height:8px;border-radius:999px;background-color:#34d399;display:inline-block;"></span>
                <span style="font-size:14px;font-weight:600;color:#b2ebcc;letter-spacing:0.6px;">KadryHR</span>
              </div>
              <div style="font-size:12px;color:#7fbfa5;margin-top:10px;">Grafiki, czas pracy i urlopy w jednym rytmie</div>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" style="background-color:#111c18;border-radius:18px;border:1px solid #0f5341;overflow:hidden;">
                <tr>
                  <td style="padding:34px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding-top:24px;">
              <p class="email-text-muted" style="font-size:12px;color:#7fbfa5;margin:0;line-height:1.6;">
                Wiadomość wysłana automatycznie z systemu KadryHR.<br>
                Jeśli nie spodziewałeś/aś się tej wiadomości, skontaktuj się ze swoim menedżerem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Primary action button
   */
  private actionButton(text: string, url: string): string {
    return `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
        <tr>
          <td style="background-color:#1ea574;border-radius:10px;border:1px solid #34d399;box-shadow:0 12px 24px rgba(16, 124, 87, 0.35);">
            <a href="${url}" target="_blank" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.2px;">
              ${text}
            </a>
          </td>
        </tr>
      </table>`;
  }

  /**
   * Info box for additional details
   */
  private infoBox(items: Array<{ label: string; value: string }>): string {
    const rows = items
      .map(
        (item) => `
        <tr>
          <td class="email-text-secondary" style="padding:8px 12px;font-size:13px;color:#b2ebcc;white-space:nowrap;">${item.label}</td>
          <td class="email-text" style="padding:8px 12px;font-size:13px;color:#e4f2ea;font-weight:600;">${item.value}</td>
        </tr>`,
      )
      .join('');

    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f1714;border-radius:12px;border:1px solid rgba(31, 59, 49, 0.8);margin:18px 0;">
        ${rows}
      </table>`;
  }

  /**
   * Employee invitation email template
   */
  invitationTemplate(params: {
    organisationName: string;
    invitationLink: string;
    inviteeName?: string;
    inviterName?: string | null;
    expiresIn?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.inviteeName
      ? `Cześć ${params.inviteeName}!`
      : 'Cześć!';
    const inviterInfo = params.inviterName
      ? ` ${params.inviterName} zaprasza Cię do dołączenia.`
      : '';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        Twoje konto w KadryHR jest gotowe
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 8px 0;">
        ${greeting}
      </p>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        Zostałeś/aś zaproszony/a do organizacji <strong>${params.organisationName}</strong> w systemie KadryHR.${inviterInfo}
      </p>
      ${this.infoBox([
        { label: 'Organizacja', value: params.organisationName },
        ...(params.expiresIn
          ? [{ label: 'Link ważny', value: params.expiresIn }]
          : []),
      ])}
      ${this.actionButton('Ustaw hasło i przejdź do panelu', params.invitationLink)}
      <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:16px 0 0 0;">
        Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
        <a href="${params.invitationLink}" style="color:#45c992;word-break:break-all;">${params.invitationLink}</a>
      </p>`;

    return {
      subject: `Zaproszenie do ${params.organisationName} – KadryHR`,
      text: `${greeting} Zostałeś/aś zaproszony/a do organizacji ${params.organisationName} w KadryHR.${inviterInfo} Ustaw hasło: ${params.invitationLink}`,
      html: this.baseTemplate(
        content,
        `Dołącz do ${params.organisationName} w KadryHR`,
      ),
    };
  }

  /**
   * User account created email template
   */
  userCreatedTemplate(params: {
    organisationName: string;
    loginUrl: string;
    recipientName?: string;
    createdByName?: string | null;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName
      ? `Cześć ${params.recipientName}!`
      : 'Cześć!';
    const creator = params.createdByName
      ? ` przez ${params.createdByName}`
      : '';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        Twoje konto w KadryHR jest aktywne
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 8px 0;">
        ${greeting}
      </p>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        Utworzono dla Ciebie konto w organizacji <strong>${params.organisationName}</strong>${creator}.
        Możesz już zalogować się do panelu KadryHR.
      </p>
      ${this.infoBox([
        { label: 'Organizacja', value: params.organisationName },
      ])}
      ${this.actionButton('Przejdź do logowania', params.loginUrl)}
      <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:16px 0 0 0;">
        Jeśli nie znasz hasła, skontaktuj się z administratorem organizacji.
      </p>`;

    return {
      subject: `Twoje konto w ${params.organisationName} – KadryHR`,
      text: `${greeting} Utworzono dla Ciebie konto w ${params.organisationName}${creator}. Zaloguj się: ${params.loginUrl}`,
      html: this.baseTemplate(
        content,
        `Twoje konto w ${params.organisationName} jest aktywne`,
      ),
    };
  }

  /**
   * Password reset template
   */
  passwordResetTemplate(params: {
    organisationName?: string;
    resetLink: string;
    recipientName?: string;
    expiresIn?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName
      ? `Cześć ${params.recipientName}!`
      : 'Cześć!';
    const orgLine = params.organisationName
      ? ` dla organizacji <strong>${params.organisationName}</strong>.`
      : '.';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        Reset hasła w KadryHR
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 12px 0;">
        ${greeting} Otrzymaliśmy prośbę o zresetowanie hasła${orgLine}
      </p>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        Kliknij przycisk poniżej, aby ustawić nowe hasło.
      </p>
      ${this.infoBox([
        ...(params.organisationName
          ? [{ label: 'Organizacja', value: params.organisationName }]
          : []),
        ...(params.expiresIn ? [{ label: 'Link ważny', value: params.expiresIn }] : []),
      ])}
      ${this.actionButton('Ustaw nowe hasło', params.resetLink)}
      <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:16px 0 0 0;">
        Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
        <a href="${params.resetLink}" style="color:#45c992;word-break:break-all;">${params.resetLink}</a>
      </p>`;

    return {
      subject: 'Reset hasła w KadryHR',
      text: `${greeting} Otrzymaliśmy prośbę o reset hasła${params.organisationName ? ` w ${params.organisationName}` : ''}. Ustaw nowe hasło: ${params.resetLink}`,
      html: this.baseTemplate(content, 'Reset hasła w KadryHR'),
    };
  }

  /**
   * Shift assignment/change notification template
   */
  shiftAssignmentTemplate(params: {
    employeeName?: string;
    action: 'assigned' | 'updated' | 'cancelled';
    shiftDate: string;
    shiftTime: string;
    position?: string | null;
    locationName?: string | null;
    notes?: string | null;
    panelUrl?: string;
  }): { subject: string; text: string; html: string } {
    const actionLabels = {
      assigned: { title: 'Nowa zmiana w grafiku', verb: 'przypisana' },
      updated: {
        title: 'Zmiana w grafiku zaktualizowana',
        verb: 'zaktualizowana',
      },
      cancelled: { title: 'Zmiana w grafiku anulowana', verb: 'anulowana' },
    };

    const { title, verb } = actionLabels[params.action];
    const greeting = params.employeeName
      ? `Cześć ${params.employeeName}!`
      : 'Cześć!';

    const infoItems: Array<{ label: string; value: string }> = [
      { label: 'Data', value: params.shiftDate },
      { label: 'Godziny', value: params.shiftTime },
    ];
    if (params.position)
      infoItems.push({ label: 'Stanowisko', value: params.position });
    if (params.locationName)
      infoItems.push({ label: 'Lokalizacja', value: params.locationName });
    if (params.notes) infoItems.push({ label: 'Uwagi', value: params.notes });

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        ${title}
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        ${greeting} Twoja zmiana została ${verb}.
      </p>
      ${this.infoBox(infoItems)}
      ${params.panelUrl ? this.actionButton('Zobacz w grafiku', params.panelUrl) : ''}`;

    return {
      subject: `${title} – KadryHR`,
      text: `${greeting} Twoja zmiana została ${verb}: ${params.shiftDate}, ${params.shiftTime}${params.position ? ` (${params.position})` : ''}`,
      html: this.baseTemplate(
        content,
        `Zmiana ${params.shiftDate} została ${verb}`,
      ),
    };
  }

  /**
   * Leave request status change notification template
   */
  leaveStatusTemplate(params: {
    employeeName?: string;
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
    leaveType: string;
    startDate: string;
    endDate: string;
    rejectionReason?: string | null;
    panelUrl?: string;
  }): { subject: string; text: string; html: string } {
    const statusLabels: Record<
      string,
      { title: string; color: string; icon: string }
    > = {
      APPROVED: { title: 'zatwierdzony', color: '#34d399', icon: '✓' },
      REJECTED: { title: 'odrzucony', color: '#f87171', icon: '✗' },
      CANCELLED: { title: 'anulowany', color: '#7fbfa5', icon: '○' },
    };

    const { title: statusTitle, color } =
      statusLabels[params.status] ?? statusLabels.CANCELLED;
    const greeting = params.employeeName
      ? `Cześć ${params.employeeName}!`
      : 'Cześć!';

    const infoItems: Array<{ label: string; value: string }> = [
      { label: 'Typ urlopu', value: params.leaveType },
      { label: 'Okres', value: `${params.startDate} – ${params.endDate}` },
      { label: 'Status', value: statusTitle.toUpperCase() },
    ];
    if (params.rejectionReason) {
      infoItems.push({ label: 'Powód', value: params.rejectionReason });
    }

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        Wniosek urlopowy ${statusTitle}
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        ${greeting} Twój wniosek urlopowy został <span style="color:${color};font-weight:600;">${statusTitle}</span>.
      </p>
      ${this.infoBox(infoItems)}
      ${params.panelUrl ? this.actionButton('Zobacz szczegóły', params.panelUrl) : ''}`;

    return {
      subject: `Wniosek urlopowy ${statusTitle} – KadryHR`,
      text: `${greeting} Twój wniosek urlopowy (${params.leaveType}) na okres ${params.startDate} – ${params.endDate} został ${statusTitle}.${params.rejectionReason ? ` Powód: ${params.rejectionReason}` : ''}`,
      html: this.baseTemplate(
        content,
        `Twój wniosek urlopowy został ${statusTitle}`,
      ),
    };
  }

  /**
   * Schedule published notification template
   */
  schedulePublishedTemplate(params: {
    employeeName?: string;
    dateRange: string;
    organisationName?: string;
    panelUrl?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.employeeName
      ? `Cześć ${params.employeeName}!`
      : 'Cześć!';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        Opublikowano nowy grafik
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        ${greeting} Nowy grafik został opublikowany${params.organisationName ? ` w ${params.organisationName}` : ''}.
      </p>
      ${this.infoBox([{ label: 'Okres', value: params.dateRange }])}
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:16px 0;">
        Sprawdź swoje zmiany w panelu KadryHR.
      </p>
      ${params.panelUrl ? this.actionButton('Zobacz grafik', params.panelUrl) : ''}`;

    return {
      subject: `Nowy grafik na okres ${params.dateRange} – KadryHR`,
      text: `${greeting} Nowy grafik został opublikowany na okres ${params.dateRange}. Sprawdź swoje zmiany w panelu KadryHR.${params.panelUrl ? ` ${params.panelUrl}` : ''}`,
      html: this.baseTemplate(
        content,
        `Sprawdź swój nowy grafik na ${params.dateRange}`,
      ),
    };
  }

  /**
   * Test/demo notification template
   */
  testNotificationTemplate(params: {
    recipientEmail: string;
    recipientName?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName
      ? `Cześć ${params.recipientName}!`
      : 'Cześć!';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        Powiadomienie testowe
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        ${greeting} To jest wiadomość testowa z systemu KadryHR.
      </p>
      ${this.infoBox([
        { label: 'Odbiorca', value: params.recipientEmail },
        { label: 'Wysłano', value: new Date().toLocaleString('pl-PL') },
      ])}
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:16px 0;">
        Jeśli widzisz tę wiadomość, to powiadomienia e-mail działają poprawnie! 🎉
      </p>`;

    return {
      subject: 'Powiadomienie testowe – KadryHR',
      text: `${greeting} To jest wiadomość testowa z systemu KadryHR. Jeśli widzisz tę wiadomość, to powiadomienia e-mail działają poprawnie!`,
      html: this.baseTemplate(
        content,
        'Twoje powiadomienia e-mail działają poprawnie!',
      ),
    };
  }

  /**
   * Lead admin notification template
   */
  leadAdminNotificationTemplate(params: {
    name: string;
    email: string;
    company: string;
    headcount?: number | null;
    message?: string;
  }): { subject: string; text: string; html: string } {
    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 12px 0;">
        Nowy lead demo KadryHR
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        Otrzymaliśmy nowe zgłoszenie demo. Poniżej znajdują się dane kontaktowe klienta.
      </p>
      ${this.infoBox([
        { label: 'Imię i nazwisko', value: params.name },
        { label: 'Email', value: params.email },
        { label: 'Firma', value: params.company },
        {
          label: 'Liczba pracowników',
          value: params.headcount ? `${params.headcount}` : 'brak danych',
        },
      ])}
      <div class="email-card" style="background-color:#0f1714;border-radius:12px;border:1px solid rgba(31, 59, 49, 0.8);padding:16px;margin-top:16px;">
        <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:0 0 8px 0;">Wiadomość klienta</p>
        <p class="email-text" style="font-size:14px;line-height:1.6;color:#e4f2ea;margin:0;">
          ${params.message ?? '—'}
        </p>
      </div>`;

    const textLines = [
      'Nowy lead demo KadryHR',
      `Imię i nazwisko: ${params.name}`,
      `Email: ${params.email}`,
      `Firma: ${params.company}`,
      `Liczba pracowników: ${params.headcount ?? 'brak danych'}`,
      `Wiadomość: ${params.message ?? '—'}`,
    ];

    return {
      subject: 'Nowy lead demo KadryHR',
      text: textLines.join('\n'),
      html: this.baseTemplate(content, `Nowy lead demo od ${params.name}`),
    };
  }

  /**
   * Lead auto-reply template
   */
  leadAutoReplyTemplate(params: {
    name: string;
    company: string;
    message?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.name ? `Cześć ${params.name}!` : 'Cześć!';
    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 12px 0;">
        Dziękujemy za zgłoszenie demo
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 12px 0;">
        ${greeting} Dziękujemy za zainteresowanie KadryHR. Wracamy z propozycją terminu demo w ciągu 24h (dni robocze).
      </p>
      ${this.infoBox([
        { label: 'Firma', value: params.company },
        {
          label: 'Status zgłoszenia',
          value: 'Potwierdzone i przekazane do opiekuna',
        },
      ])}
      <div class="email-card" style="background-color:#0f1714;border-radius:12px;border:1px solid rgba(31, 59, 49, 0.8);padding:16px;margin-top:16px;">
        <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:0 0 8px 0;">Twoja wiadomość</p>
        <p class="email-text" style="font-size:14px;line-height:1.6;color:#e4f2ea;margin:0;">
          ${params.message ?? '—'}
        </p>
      </div>
      <p class="email-text" style="font-size:14px;line-height:1.6;color:#cfe9de;margin:16px 0 0 0;">
        Jeśli coś się zmieniło, możesz odpowiedzieć bezpośrednio na tę wiadomość.
      </p>`;

    return {
      subject: 'KadryHR – potwierdzenie zgłoszenia demo',
      text: `${greeting}\n\nDziękujemy za zgłoszenie demo KadryHR. Wracamy z propozycją terminu do 24h (dni robocze).\n\nTwoja wiadomość: ${params.message ?? '—'}\n\nPozdrawiamy,\nZespół KadryHR`,
      html: this.baseTemplate(
        content,
        `Dziękujemy za zgłoszenie demo, ${params.name}`,
      ),
    };
  }

  /**
   * Newsletter confirmation template
   */
  newsletterConfirmationTemplate(params: {
    confirmLink: string;
    recipientName?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName
      ? `Cześć ${params.recipientName}!`
      : 'Cześć!';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 12px 0;">
        Potwierdź zapis do newslettera
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        ${greeting} Dziękujemy za zapis do newslettera KadryHR. Kliknij przycisk poniżej, aby potwierdzić subskrypcję.
      </p>
      ${this.actionButton('Potwierdź subskrypcję', params.confirmLink)}
      <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:16px 0 0 0;">
        Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
        <a href="${params.confirmLink}" style="color:#45c992;word-break:break-all;">${params.confirmLink}</a>
      </p>`;

    return {
      subject: 'Potwierdź zapis do newslettera KadryHR',
      text: `${greeting} Dziękujemy za zapis do newslettera KadryHR. Potwierdź subskrypcję: ${params.confirmLink}`,
      html: this.baseTemplate(
        content,
        'Potwierdź zapis do newslettera KadryHR',
      ),
    };
  }

  /**
   * Newsletter welcome template
   */
  newsletterWelcomeTemplate(params: {
    recipientName?: string;
    ctaUrl: string;
    unsubscribeUrl: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName
      ? `Cześć ${params.recipientName}!`
      : 'Cześć!';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 12px 0;">
        Witaj w newsletterze KadryHR
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 12px 0;">
        ${greeting} Dziękujemy za dołączenie do społeczności KadryHR. Od teraz będziemy dzielić się wskazówkami, jak szybciej planować grafiki, liczyć czas pracy i dbać o płynne zmiany.
      </p>
      ${this.infoBox([
        {
          label: 'Co przygotowaliśmy',
          value: 'Sprawdzone praktyki dla retail i gastro',
        },
        { label: 'Jak często', value: '1–2 wiadomości w miesiącu' },
      ])}
      <div class="email-card" style="background-color:#0f1714;border-radius:12px;border:1px solid rgba(31, 59, 49, 0.8);padding:16px;margin-top:16px;">
        <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:0 0 8px 0;">Na start polecamy</p>
        <ul class="email-text" style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;color:#e4f2ea;">
          <li>Checklistę zamknięcia miesiąca bez nadgodzin.</li>
          <li>Gotowy przepływ komunikacji z zespołem zmianowym.</li>
          <li>Alerty o brakach obsady w grafiku.</li>
        </ul>
      </div>
      ${this.actionButton('Zobacz panel KadryHR', params.ctaUrl)}
      <p class="email-text-secondary" style="font-size:13px;color:#7fbfa5;margin:16px 0 0 0;">
        Jeśli nie chcesz otrzymywać tego typu wiadomości, możesz się wypisać:<br>
        <a href="${params.unsubscribeUrl}" style="color:#45c992;word-break:break-all;">${params.unsubscribeUrl}</a>
      </p>`;

    return {
      subject: 'Witaj w newsletterze KadryHR',
      text: `${greeting} Dziękujemy za dołączenie do newslettera KadryHR. Startujemy z praktycznymi wskazówkami dla retail i gastro. Zobacz panel: ${params.ctaUrl}. Wypisz się: ${params.unsubscribeUrl}`,
      html: this.baseTemplate(content, 'Witaj w newsletterze KadryHR!'),
    };
  }

  /**
   * Generic notification template (for custom notifications)
   */
  genericTemplate(params: {
    title: string;
    body: string;
    recipientName?: string;
    actionUrl?: string;
    actionLabel?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName
      ? `Cześć ${params.recipientName}!`
      : '';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#e4f2ea;margin:0 0 16px 0;">
        ${params.title}
      </h1>
      ${greeting ? `<p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 8px 0;">${greeting}</p>` : ''}
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#cfe9de;margin:0 0 16px 0;">
        ${params.body}
      </p>
      ${params.actionUrl && params.actionLabel ? this.actionButton(params.actionLabel, params.actionUrl) : ''}`;

    return {
      subject: `${params.title} – KadryHR`,
      text: `${greeting ? greeting + ' ' : ''}${params.body}${params.actionUrl ? ` ${params.actionUrl}` : ''}`,
      html: this.baseTemplate(content, params.body.substring(0, 100)),
    };
  }
}

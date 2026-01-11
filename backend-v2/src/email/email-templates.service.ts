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
      ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>`
      : '';

    return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
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
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0f172a !important; }
      .email-card { background-color: #1e293b !important; border-color: #334155 !important; }
      .email-text { color: #f1f5f9 !important; }
      .email-text-secondary { color: #94a3b8 !important; }
      .email-text-muted { color: #64748b !important; }
      .email-divider { border-color: #334155 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preview}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-bg" style="background-color:#f8fafc;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
          <!-- Logo Header -->
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="font-size:24px;font-weight:700;color:#2563eb;letter-spacing:-0.5px;">KadryHR</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">System zarządzania personelem</div>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" style="background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="padding:32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding-top:24px;">
              <p class="email-text-muted" style="font-size:12px;color:#64748b;margin:0;line-height:1.5;">
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
          <td style="background-color:#2563eb;border-radius:8px;">
            <a href="${url}" target="_blank" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
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
          <td class="email-text-secondary" style="padding:8px 12px;font-size:13px;color:#64748b;white-space:nowrap;">${item.label}</td>
          <td class="email-text" style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:500;">${item.value}</td>
        </tr>`,
      )
      .join('');

    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" style="background-color:#f8fafc;border-radius:8px;margin:16px 0;">
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
    const greeting = params.inviteeName ? `Cześć ${params.inviteeName}!` : 'Cześć!';
    const inviterInfo = params.inviterName ? ` ${params.inviterName} zaprasza Cię do dołączenia.` : '';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 16px 0;">
        Twoje konto w KadryHR jest gotowe
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 8px 0;">
        ${greeting}
      </p>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">
        Zostałeś/aś zaproszony/a do organizacji <strong>${params.organisationName}</strong> w systemie KadryHR.${inviterInfo}
      </p>
      ${this.infoBox([
        { label: 'Organizacja', value: params.organisationName },
        ...(params.expiresIn ? [{ label: 'Link ważny', value: params.expiresIn }] : []),
      ])}
      ${this.actionButton('Ustaw hasło i przejdź do panelu', params.invitationLink)}
      <p class="email-text-secondary" style="font-size:13px;color:#64748b;margin:16px 0 0 0;">
        Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
        <a href="${params.invitationLink}" style="color:#2563eb;word-break:break-all;">${params.invitationLink}</a>
      </p>`;

    return {
      subject: `Zaproszenie do ${params.organisationName} – KadryHR`,
      text: `${greeting} Zostałeś/aś zaproszony/a do organizacji ${params.organisationName} w KadryHR.${inviterInfo} Ustaw hasło: ${params.invitationLink}`,
      html: this.baseTemplate(content, `Dołącz do ${params.organisationName} w KadryHR`),
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
      updated: { title: 'Zmiana w grafiku zaktualizowana', verb: 'zaktualizowana' },
      cancelled: { title: 'Zmiana w grafiku anulowana', verb: 'anulowana' },
    };

    const { title, verb } = actionLabels[params.action];
    const greeting = params.employeeName ? `Cześć ${params.employeeName}!` : 'Cześć!';

    const infoItems: Array<{ label: string; value: string }> = [
      { label: 'Data', value: params.shiftDate },
      { label: 'Godziny', value: params.shiftTime },
    ];
    if (params.position) infoItems.push({ label: 'Stanowisko', value: params.position });
    if (params.locationName) infoItems.push({ label: 'Lokalizacja', value: params.locationName });
    if (params.notes) infoItems.push({ label: 'Uwagi', value: params.notes });

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 16px 0;">
        ${title}
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">
        ${greeting} Twoja zmiana została ${verb}.
      </p>
      ${this.infoBox(infoItems)}
      ${params.panelUrl ? this.actionButton('Zobacz w grafiku', params.panelUrl) : ''}`;

    return {
      subject: `${title} – KadryHR`,
      text: `${greeting} Twoja zmiana została ${verb}: ${params.shiftDate}, ${params.shiftTime}${params.position ? ` (${params.position})` : ''}`,
      html: this.baseTemplate(content, `Zmiana ${params.shiftDate} została ${verb}`),
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
    const statusLabels: Record<string, { title: string; color: string; icon: string }> = {
      APPROVED: { title: 'zatwierdzony', color: '#16a34a', icon: '✓' },
      REJECTED: { title: 'odrzucony', color: '#dc2626', icon: '✗' },
      CANCELLED: { title: 'anulowany', color: '#64748b', icon: '○' },
    };

    const { title: statusTitle, color } = statusLabels[params.status] ?? statusLabels.CANCELLED;
    const greeting = params.employeeName ? `Cześć ${params.employeeName}!` : 'Cześć!';

    const infoItems: Array<{ label: string; value: string }> = [
      { label: 'Typ urlopu', value: params.leaveType },
      { label: 'Okres', value: `${params.startDate} – ${params.endDate}` },
      { label: 'Status', value: statusTitle.toUpperCase() },
    ];
    if (params.rejectionReason) {
      infoItems.push({ label: 'Powód', value: params.rejectionReason });
    }

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 16px 0;">
        Wniosek urlopowy ${statusTitle}
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">
        ${greeting} Twój wniosek urlopowy został <span style="color:${color};font-weight:600;">${statusTitle}</span>.
      </p>
      ${this.infoBox(infoItems)}
      ${params.panelUrl ? this.actionButton('Zobacz szczegóły', params.panelUrl) : ''}`;

    return {
      subject: `Wniosek urlopowy ${statusTitle} – KadryHR`,
      text: `${greeting} Twój wniosek urlopowy (${params.leaveType}) na okres ${params.startDate} – ${params.endDate} został ${statusTitle}.${params.rejectionReason ? ` Powód: ${params.rejectionReason}` : ''}`,
      html: this.baseTemplate(content, `Twój wniosek urlopowy został ${statusTitle}`),
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
    const greeting = params.employeeName ? `Cześć ${params.employeeName}!` : 'Cześć!';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 16px 0;">
        Opublikowano nowy grafik
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">
        ${greeting} Nowy grafik został opublikowany${params.organisationName ? ` w ${params.organisationName}` : ''}.
      </p>
      ${this.infoBox([{ label: 'Okres', value: params.dateRange }])}
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:16px 0;">
        Sprawdź swoje zmiany w panelu KadryHR.
      </p>
      ${params.panelUrl ? this.actionButton('Zobacz grafik', params.panelUrl) : ''}`;

    return {
      subject: `Nowy grafik na okres ${params.dateRange} – KadryHR`,
      text: `${greeting} Nowy grafik został opublikowany na okres ${params.dateRange}. Sprawdź swoje zmiany w panelu KadryHR.${params.panelUrl ? ` ${params.panelUrl}` : ''}`,
      html: this.baseTemplate(content, `Sprawdź swój nowy grafik na ${params.dateRange}`),
    };
  }

  /**
   * Test/demo notification template
   */
  testNotificationTemplate(params: {
    recipientEmail: string;
    recipientName?: string;
  }): { subject: string; text: string; html: string } {
    const greeting = params.recipientName ? `Cześć ${params.recipientName}!` : 'Cześć!';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 16px 0;">
        Powiadomienie testowe
      </h1>
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">
        ${greeting} To jest wiadomość testowa z systemu KadryHR.
      </p>
      ${this.infoBox([
        { label: 'Odbiorca', value: params.recipientEmail },
        { label: 'Wysłano', value: new Date().toLocaleString('pl-PL') },
      ])}
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:16px 0;">
        Jeśli widzisz tę wiadomość, to powiadomienia e-mail działają poprawnie! 🎉
      </p>`;

    return {
      subject: 'Powiadomienie testowe – KadryHR',
      text: `${greeting} To jest wiadomość testowa z systemu KadryHR. Jeśli widzisz tę wiadomość, to powiadomienia e-mail działają poprawnie!`,
      html: this.baseTemplate(content, 'Twoje powiadomienia e-mail działają poprawnie!'),
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
    const greeting = params.recipientName ? `Cześć ${params.recipientName}!` : '';

    const content = `
      <h1 class="email-text" style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 16px 0;">
        ${params.title}
      </h1>
      ${greeting ? `<p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 8px 0;">${greeting}</p>` : ''}
      <p class="email-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">
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

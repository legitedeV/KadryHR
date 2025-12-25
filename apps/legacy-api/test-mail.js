require('dotenv').config();
const { sendInviteEmail } = require('./utils/email');

console.log('=== TEST WYSYŁKI MAILI PRZEZ OVH ===\n');

// Sprawdź konfigurację
console.log('Konfiguracja SMTP:');
console.log('- Host:', process.env.SMTP_HOST || '❌ BRAK');
console.log('- Port:', process.env.SMTP_PORT || '❌ BRAK');
console.log('- User:', process.env.SMTP_USER || '❌ BRAK');
console.log('- From:', process.env.SMTP_FROM || process.env.SMTP_USER || '❌ BRAK');
console.log('- Secure:', process.env.SMTP_SECURE || 'false');
console.log('- Frontend URL:', process.env.FRONTEND_URL || 'http://kadryhr.pl');
console.log('');

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ BŁĄD: Brak konfiguracji SMTP w pliku .env');
  console.error('');
  console.error('Utwórz plik .env w katalogu backend/ i dodaj:');
  console.error('');
  console.error('SMTP_HOST=ssl0.ovh.net');
  console.error('SMTP_PORT=587');
  console.error('SMTP_SECURE=false');
  console.error('SMTP_USER=noreply@kadryhr.pl');
  console.error('SMTP_PASS=twoje_haslo');
  console.error('SMTP_FROM=KadryHR <noreply@kadryhr.pl>');
  console.error('FRONTEND_URL=https://kadryhr.pl');
  console.error('');
  process.exit(1);
}

// Zmień na swój email testowy
const TEST_EMAIL = 'TWÓJ_MAIL_TESTOWY@gmail.com';

if (TEST_EMAIL === 'TWÓJ_MAIL_TESTOWY@gmail.com') {
  console.error('❌ BŁĄD: Zmień TEST_EMAIL w pliku test-mail.js na swój prawdziwy adres email!');
  console.error('');
  process.exit(1);
}

(async () => {
  try {
    console.log(`📧 Wysyłam testowy email na: ${TEST_EMAIL}...`);
    console.log('');
    
    await sendInviteEmail({
      to: TEST_EMAIL,
      inviteUrl: 'https://kadryhr.pl/register?token=test123&email=' + encodeURIComponent(TEST_EMAIL),
      invitedBy: 'Test KadryHR (test-mail.js)',
    });
    
    console.log('');
    console.log('✅ Testowa wysyłka zaproszenia zakończona sukcesem!');
    console.log('');
    console.log('Sprawdź swoją skrzynkę email:', TEST_EMAIL);
    console.log('(Sprawdź też folder SPAM jeśli nie widzisz wiadomości)');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('');
    console.error('❌ Błąd przy wysyłce test-maila:');
    console.error('');
    console.error(err.message);
    console.error('');
    console.error('Sprawdź:');
    console.error('1. Czy dane SMTP w .env są poprawne');
    console.error('2. Czy hasło do email jest prawidłowe');
    console.error('3. Czy konto email jest aktywne w panelu OVH');
    console.error('4. Czy port 587 nie jest zablokowany przez firewall');
    console.error('');
    console.error('Szczegóły błędu:', err);
    console.error('');
    process.exit(1);
  }
})();

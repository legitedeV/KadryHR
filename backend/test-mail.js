require('dotenv').config();
const { sendInviteEmail } = require('./utils/email');

(async () => {
  try {
    await sendInviteEmail({
      to: 'TWÓJ_MAIL_TESTOWY@gmail.com', // zmień na swój
      inviteUrl: 'https://kadryhr.pl/register?token=test',
      invitedBy: 'Test KadryHR',
    });
    console.log('Testowa wysyłka zaproszenia OK (jeśli nie ma błędu powyżej).');
    process.exit(0);
  } catch (err) {
    console.error('Błąd przy wysyłce test-maila:', err);
    process.exit(1);
  }
})();

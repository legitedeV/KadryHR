const Notification = require('../models/Notification');

/**
 * Tworzy powiadomienie dla użytkownika.
 * Jeśli userId jest pusty – nic nie robi.
 */
async function createNotification(userId, type, title, message) {
  try {
    if (!userId) return null;

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
    });

    // Tu w przyszłości można dohookować np. web push / email
    return notification;
  } catch (err) {
    console.error('Błąd przy tworzeniu powiadomienia:', err);
    return null;
  }
}

module.exports = {
  createNotification,
};

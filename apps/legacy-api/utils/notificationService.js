const Notification = require('../models/Notification');
const eventBus = require('./eventBus');

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

    // Emit realtime event for SSE
    eventBus.emitEvent('notification.created', {
      userId: userId.toString(),
      notification: notification.toObject(),
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

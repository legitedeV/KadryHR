const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationService');

/**
 * Powiadomienia zalogowanego użytkownika.
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

/**
 * Oznacz powiadomienie jako przeczytane.
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({ message: 'Powiadomienie nie istnieje.' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    next(err);
  }
};

/**
 * Ręczne utworzenie powiadomienia (np. szybka notatka z dashboardu).
 * Jeśli nie podamy userId – powiadomienie trafia do aktualnego użytkownika.
 */
exports.createNotificationManual = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { userId: targetUserId, title, message, type } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    if (!title || !message) {
      return res.status(400).json({ message: 'Tytuł i treść są wymagane.' });
    }

    const notification = await createNotification(
      targetUserId || userId,
      type || 'general',
      title,
      message
    );

    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
};

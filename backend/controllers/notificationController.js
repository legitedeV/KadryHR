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
 * Oznacz wszystkie powiadomienia jako przeczytane.
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Wszystkie powiadomienia oznaczone jako przeczytane.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Usuń powiadomienie.
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Sprawdź czy użytkownik jest adminem lub czy to jego powiadomienie
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Powiadomienie nie istnieje.' });
    }

    // Admin może usuwać wszystkie powiadomienia
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isOwner = notification.user.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Brak uprawnień do usunięcia tego powiadomienia.' });
    }

    await Notification.findByIdAndDelete(id);

    res.json({ message: 'Powiadomienie zostało usunięte.' });
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

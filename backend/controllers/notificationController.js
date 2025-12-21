const Notification = require('../models/Notification');

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

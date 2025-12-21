const express = require('express');
const asyncHandler = require('express-async-handler');
const Invite = require('../models/Invite');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Zestaw middleware dla endpointów tylko dla admina
const adminOnly = [protect, requireRole('admin')];

/**
 * GET /api/invites
 * Lista wszystkich zaproszeń (tylko admin)
 */
router.get(
  '/',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const invites = await Invite.find().sort({ createdAt: -1 });
    res.json({ invites });
  })
);

/**
 * POST /api/invites
 * Utworzenie nowego zaproszenia (tylko admin)
 */
router.post(
  '/',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email jest wymagany.' });
    }

    // Prosty token – w realu lepiej crypto.randomBytes
    const token =
      Math.random().toString(36).slice(2) + Date.now().toString(36);

    const invite = await Invite.create({
      email,
      role: role || 'user',
      token,
      status: 'pending',
      invitedBy: req.user ? req.user._id : null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dni
    });

    res.status(201).json({ invite });
  })
);

/**
 * DELETE /api/invites/:id
 * Usunięcie zaproszenia (tylko admin)
 */
router.delete(
  '/:id',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const invite = await Invite.findByIdAndDelete(req.params.id);

    if (!invite) {
      return res
        .status(404)
        .json({ message: 'Zaproszenie o podanym ID nie istnieje.' });
    }

    res.json({ message: 'Zaproszenie zostało usunięte.' });
  })
);

module.exports = router;

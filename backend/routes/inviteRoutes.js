const express = require('express');
const asyncHandler = require('express-async-handler');
const Invite = require('../models/Invite');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { sendInviteEmail } = require('../utils/email');

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
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dni
    });

    // Generuj pełny URL zaproszenia
    const frontendUrl = process.env.FRONTEND_URL || 'http://kadryhr.pl';
    const inviteUrl = `${frontendUrl}/register?token=${token}&email=${encodeURIComponent(email)}`;

    // Wyślij email z zaproszeniem
    let emailSent = false;
    let emailError = null;
    
    try {
      const emailResult = await sendInviteEmail({
        to: email,
        inviteUrl,
        invitedBy: req.user ? req.user.name : 'Administrator',
      });
      
      if (emailResult && emailResult.success) {
        emailSent = true;
        console.log(`✅ Wysłano zaproszenie email do: ${email}`);
      } else {
        emailError = emailResult?.error || 'SMTP nie skonfigurowane';
        console.warn(`⚠️  Email nie został wysłany: ${emailError}`);
      }
    } catch (err) {
      emailError = err.message || 'Błąd wysyłki email';
      console.error('❌ Błąd wysyłki email zaproszenia:', err);
      // Nie przerywamy procesu - zaproszenie zostało utworzone
    }

    res.status(201).json({ 
      invite,
      link: inviteUrl,
      emailSent,
      emailError: emailSent ? null : emailError,
      message: emailSent 
        ? 'Zaproszenie utworzone i wysłane na email' 
        : 'Zaproszenie utworzone. Email nie został wysłany - skopiuj link ręcznie.',
    });
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

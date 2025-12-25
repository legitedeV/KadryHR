const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/calculate', requirePermission('payroll.calculate', { allowAdmin: true }), (req, res, next) => {
  try {
    const { hourlyRate = 0, baseHours = 160, overtimeHours = 0, overtimeMultiplier = 1.5, bonus = 0 } = req.body;

    const base = Number(hourlyRate) * Number(baseHours);
    const overtime = Number(hourlyRate) * Number(overtimeHours) * Number(overtimeMultiplier);
    const gross = base + overtime + Number(bonus);

    const taxRate = 0.17;
    const contributionsRate = 0.1371;

    const contributions = gross * contributionsRate;
    const tax = (gross - contributions) * taxRate;
    const net = gross - contributions - tax;

    res.json({
      base: Math.round(base),
      overtime: Math.round(overtime),
      bonus: Math.round(bonus),
      gross: Math.round(gross),
      contributions: Math.round(contributions),
      tax: Math.round(tax),
      net: Math.round(net),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

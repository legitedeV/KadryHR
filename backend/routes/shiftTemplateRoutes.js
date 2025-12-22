const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ShiftTemplate = require('../models/ShiftTemplate');

const router = express.Router();

router.use(protect);

/**
 * Pobranie szablonów zmian
 */
router.get('/', async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { isActive, shiftType } = req.query;

    const query = {};

    // Admin widzi wszystkie, user tylko swoje
    if (role !== 'admin') {
      query.companyId = userId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (shiftType) {
      query.shiftType = shiftType;
    }

    const templates = await ShiftTemplate.find(query).sort({ name: 1 });

    res.json(templates);
  } catch (err) {
    next(err);
  }
});

/**
 * Pobranie pojedynczego szablonu
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await ShiftTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Szablon nie istnieje' });
    }

    res.json(template);
  } catch (err) {
    next(err);
  }
});

/**
 * Utworzenie nowego szablonu (tylko admin)
 */
router.post('/', async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może tworzyć szablony' });
    }

    const {
      name,
      description,
      shiftType,
      startTime,
      endTime,
      breaks,
      requiredStaff,
      requiredSkills,
      color,
      additionalCostMultiplier,
    } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        message: 'Wymagane pola: name, startTime, endTime',
      });
    }

    const template = await ShiftTemplate.create({
      companyId: userId,
      name,
      description: description || '',
      shiftType: shiftType || 'custom',
      startTime,
      endTime,
      breaks: breaks || [],
      requiredStaff: requiredStaff || 1,
      requiredSkills: requiredSkills || [],
      color: color || '#3b82f6',
      additionalCostMultiplier: additionalCostMultiplier || 1.0,
      isActive: true,
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

/**
 * Aktualizacja szablonu (tylko admin)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może edytować szablony' });
    }

    const { id } = req.params;

    const template = await ShiftTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Szablon nie istnieje' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'companyId') {
        template[key] = updates[key];
      }
    });

    await template.save();

    res.json(template);
  } catch (err) {
    next(err);
  }
});

/**
 * Usunięcie szablonu (tylko admin)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może usuwać szablony' });
    }

    const { id } = req.params;

    const template = await ShiftTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Szablon nie istnieje' });
    }

    await ShiftTemplate.findByIdAndDelete(id);

    res.json({ message: 'Szablon usunięty' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

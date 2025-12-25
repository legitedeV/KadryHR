const ShiftTemplate = require('../models/ShiftTemplate');

/**
 * Get all shift templates for the company
 */
exports.getShiftTemplates = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Determine company ID
    const company = companyId || userId;

    const templates = await ShiftTemplate.find({ company })
      .sort({ isDefault: -1, name: 1 })
      .limit(100);

    res.json({ templates });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single shift template
 */
exports.getShiftTemplate = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const template = await ShiftTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Szablon nie istnieje.' });
    }

    // Check permissions
    const company = companyId || userId;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isOwner = template.company.toString() === company.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Brak uprawnień do tego szablonu.' });
    }

    res.json({ template });
  } catch (err) {
    next(err);
  }
};

/**
 * Create shift template (admin only)
 */
exports.createShiftTemplate = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can create templates
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą tworzyć szablony.' });
    }

    const { name, startTime, endTime, color, type, description, isDefault } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ message: 'Nazwa, godzina rozpoczęcia i zakończenia są wymagane.' });
    }

    // Determine company
    const company = companyId || userId;

    const template = await ShiftTemplate.create({
      name,
      startTime,
      endTime,
      color: color || '#3b82f6',
      type: type || 'custom',
      description,
      isDefault: isDefault || false,
      company
    });

    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
};

/**
 * Update shift template (admin only)
 */
exports.updateShiftTemplate = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can update templates
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą edytować szablony.' });
    }

    const template = await ShiftTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Szablon nie istnieje.' });
    }

    // Check ownership
    const company = companyId || userId;
    if (template.company.toString() !== company.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do tego szablonu.' });
    }

    const { name, startTime, endTime, color, type, description, isDefault } = req.body;

    if (name !== undefined) template.name = name;
    if (startTime !== undefined) template.startTime = startTime;
    if (endTime !== undefined) template.endTime = endTime;
    if (color !== undefined) template.color = color;
    if (type !== undefined) template.type = type;
    if (description !== undefined) template.description = description;
    if (isDefault !== undefined) template.isDefault = isDefault;

    await template.save();

    res.json({ template });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete shift template (admin only)
 */
exports.deleteShiftTemplate = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can delete templates
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą usuwać szablony.' });
    }

    const template = await ShiftTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Szablon nie istnieje.' });
    }

    // Check ownership
    const company = companyId || userId;
    if (template.company.toString() !== company.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do tego szablonu.' });
    }

    await ShiftTemplate.findByIdAndDelete(id);

    res.json({ message: 'Szablon został usunięty.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Create default shift templates for a company
 */
exports.createDefaultTemplates = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can create default templates
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą tworzyć domyślne szablony.' });
    }

    const company = companyId || userId;

    // Check if default templates already exist
    const existingTemplates = await ShiftTemplate.find({ company, isDefault: true });
    if (existingTemplates.length > 0) {
      return res.status(400).json({ message: 'Domyślne szablony już istnieją.' });
    }

    const defaultTemplates = [
      {
        name: 'Poranna (06:00-14:00)',
        startTime: '06:00',
        endTime: '14:00',
        color: '#f59e0b',
        type: 'morning',
        isDefault: true,
        company
      },
      {
        name: 'Dzienna (08:00-16:00)',
        startTime: '08:00',
        endTime: '16:00',
        color: '#3b82f6',
        type: 'afternoon',
        isDefault: true,
        company
      },
      {
        name: 'Popołudniowa (14:00-22:00)',
        startTime: '14:00',
        endTime: '22:00',
        color: '#8b5cf6',
        type: 'evening',
        isDefault: true,
        company
      },
      {
        name: 'Nocna (22:00-06:00)',
        startTime: '22:00',
        endTime: '06:00',
        color: '#1e293b',
        type: 'night',
        isDefault: true,
        company
      }
    ];

    const templates = await ShiftTemplate.insertMany(defaultTemplates);

    res.status(201).json({ templates, message: 'Domyślne szablony zostały utworzone.' });
  } catch (err) {
    next(err);
  }
};

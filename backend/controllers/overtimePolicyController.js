const OvertimePolicy = require('../models/OvertimePolicy');

/**
 * Get all overtime policies for the company
 */
exports.getOvertimePolicies = async (req, res, next) => {
  try {
    const { id: userId, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const company = companyId || userId;
    const { isActive } = req.query;

    const filter = { company };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const policies = await OvertimePolicy.find(filter)
      .populate('applicableTo.departments', 'name')
      .populate('applicableTo.employees', 'firstName lastName')
      .populate('excludedEmployees', 'firstName lastName')
      .sort({ isActive: -1, effectiveFrom: -1 })
      .limit(100);

    res.json({ policies });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single overtime policy
 */
exports.getOvertimePolicy = async (req, res, next) => {
  try {
    const { id: userId, companyId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const policy = await OvertimePolicy.findById(id)
      .populate('applicableTo.departments', 'name')
      .populate('applicableTo.employees', 'firstName lastName')
      .populate('excludedEmployees', 'firstName lastName');

    if (!policy) {
      return res.status(404).json({ message: 'Polityka nadgodzin nie istnieje.' });
    }

    const company = companyId || userId;
    if (policy.company.toString() !== company.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do tej polityki.' });
    }

    res.json({ policy });
  } catch (err) {
    next(err);
  }
};

/**
 * Create overtime policy (admin only)
 */
exports.createOvertimePolicy = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą tworzyć polityki nadgodzin.' });
    }

    const company = companyId || userId;

    const {
      name,
      description,
      dailyOvertimeThreshold,
      dailyOvertimeLimit,
      weeklyOvertimeThreshold,
      weeklyOvertimeLimit,
      monthlyOvertimeLimit,
      overtimeRate,
      weekendOvertimeRate,
      holidayOvertimeRate,
      nightShiftOvertimeRate,
      requiresApproval,
      autoApproveUnder,
      approvalRequired,
      notifyManagerAt,
      notifyHRAt,
      sendWeeklyReport,
      sendMonthlyReport,
      monthlyOvertimeBudget,
      alertAtBudgetPercentage,
      allowConsecutiveOvertimeDays,
      maxConsecutiveOvertimeDays,
      restrictOvertimeForPartTime,
      applicableTo,
      excludedEmployees,
      isActive,
      effectiveFrom,
      effectiveTo,
      complianceNotes,
      legalReference
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nazwa polityki jest wymagana.' });
    }

    const policy = await OvertimePolicy.create({
      company,
      name,
      description,
      dailyOvertimeThreshold: dailyOvertimeThreshold || 8,
      dailyOvertimeLimit,
      weeklyOvertimeThreshold: weeklyOvertimeThreshold || 40,
      weeklyOvertimeLimit: weeklyOvertimeLimit || 48,
      monthlyOvertimeLimit,
      overtimeRate: overtimeRate || 1.5,
      weekendOvertimeRate: weekendOvertimeRate || 2.0,
      holidayOvertimeRate: holidayOvertimeRate || 2.5,
      nightShiftOvertimeRate: nightShiftOvertimeRate || 1.75,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      autoApproveUnder: autoApproveUnder || 2,
      approvalRequired: approvalRequired || ['manager'],
      notifyManagerAt: notifyManagerAt || 4,
      notifyHRAt: notifyHRAt || 8,
      sendWeeklyReport: sendWeeklyReport !== undefined ? sendWeeklyReport : true,
      sendMonthlyReport: sendMonthlyReport !== undefined ? sendMonthlyReport : true,
      monthlyOvertimeBudget,
      alertAtBudgetPercentage: alertAtBudgetPercentage || 80,
      allowConsecutiveOvertimeDays: allowConsecutiveOvertimeDays !== undefined ? allowConsecutiveOvertimeDays : true,
      maxConsecutiveOvertimeDays: maxConsecutiveOvertimeDays || 5,
      restrictOvertimeForPartTime: restrictOvertimeForPartTime !== undefined ? restrictOvertimeForPartTime : true,
      applicableTo,
      excludedEmployees,
      isActive: isActive !== undefined ? isActive : true,
      effectiveFrom: effectiveFrom || Date.now(),
      effectiveTo,
      complianceNotes,
      legalReference
    });

    res.status(201).json({ policy, message: 'Polityka nadgodzin została utworzona.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Update overtime policy (admin only)
 */
exports.updateOvertimePolicy = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą edytować polityki nadgodzin.' });
    }

    const policy = await OvertimePolicy.findById(id);

    if (!policy) {
      return res.status(404).json({ message: 'Polityka nadgodzin nie istnieje.' });
    }

    const company = companyId || userId;
    if (policy.company.toString() !== company.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do tej polityki.' });
    }

    const allowedUpdates = [
      'name', 'description', 'dailyOvertimeThreshold', 'dailyOvertimeLimit',
      'weeklyOvertimeThreshold', 'weeklyOvertimeLimit', 'monthlyOvertimeLimit',
      'overtimeRate', 'weekendOvertimeRate', 'holidayOvertimeRate', 'nightShiftOvertimeRate',
      'requiresApproval', 'autoApproveUnder', 'approvalRequired',
      'notifyManagerAt', 'notifyHRAt', 'sendWeeklyReport', 'sendMonthlyReport',
      'monthlyOvertimeBudget', 'alertAtBudgetPercentage',
      'allowConsecutiveOvertimeDays', 'maxConsecutiveOvertimeDays', 'restrictOvertimeForPartTime',
      'applicableTo', 'excludedEmployees', 'isActive', 'effectiveFrom', 'effectiveTo',
      'complianceNotes', 'legalReference'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        policy[field] = req.body[field];
      }
    });

    await policy.save();

    res.json({ policy, message: 'Polityka nadgodzin została zaktualizowana.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete overtime policy (admin only)
 */
exports.deleteOvertimePolicy = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą usuwać polityki nadgodzin.' });
    }

    const policy = await OvertimePolicy.findById(id);

    if (!policy) {
      return res.status(404).json({ message: 'Polityka nadgodzin nie istnieje.' });
    }

    const company = companyId || userId;
    if (policy.company.toString() !== company.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do tej polityki.' });
    }

    await OvertimePolicy.findByIdAndDelete(id);

    res.json({ message: 'Polityka nadgodzin została usunięta.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get active overtime policy for employee
 */
exports.getActivePolicyForEmployee = async (req, res, next) => {
  try {
    const { id: userId, companyId } = req.user || {};
    const { employeeId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const company = companyId || userId;
    const now = new Date();

    // Find active policies that apply to this employee
    const policies = await OvertimePolicy.find({
      company,
      isActive: true,
      $or: [
        { effectiveFrom: { $lte: now }, effectiveTo: { $gte: now } },
        { effectiveFrom: { $lte: now }, effectiveTo: null }
      ],
      excludedEmployees: { $ne: employeeId }
    });

    // Filter policies that apply to this employee
    const applicablePolicies = policies.filter(policy => {
      // If no specific applicableTo, it applies to all
      if (!policy.applicableTo || 
          (!policy.applicableTo.employees?.length && 
           !policy.applicableTo.departments?.length && 
           !policy.applicableTo.positions?.length)) {
        return true;
      }

      // Check if employee is explicitly included
      if (policy.applicableTo.employees?.some(e => e.toString() === employeeId)) {
        return true;
      }

      // TODO: Check department and position when employee data is available
      return false;
    });

    // Return the most recent applicable policy
    const activePolicy = applicablePolicies.sort((a, b) => 
      b.effectiveFrom - a.effectiveFrom
    )[0] || null;

    res.json({ policy: activePolicy });
  } catch (err) {
    next(err);
  }
};

/**
 * Check if overtime hours require approval
 */
exports.checkOvertimeApproval = async (req, res, next) => {
  try {
    const { id: userId, companyId } = req.user || {};
    const { employeeId, hours, date, isWeekend, isHoliday, isNightShift } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    if (!employeeId || !hours) {
      return res.status(400).json({ message: 'ID pracownika i liczba godzin są wymagane.' });
    }

    const company = companyId || userId;
    const checkDate = date ? new Date(date) : new Date();

    // Find active policy for employee
    const policies = await OvertimePolicy.find({
      company,
      isActive: true,
      $or: [
        { effectiveFrom: { $lte: checkDate }, effectiveTo: { $gte: checkDate } },
        { effectiveFrom: { $lte: checkDate }, effectiveTo: null }
      ],
      excludedEmployees: { $ne: employeeId }
    });

    const activePolicy = policies[0];

    if (!activePolicy) {
      return res.json({
        requiresApproval: true,
        reason: 'Brak aktywnej polityki nadgodzin',
        overtimeRate: 1.5
      });
    }

    const requiresApproval = activePolicy.requiresApprovalForHours(hours);
    const overtimeRate = activePolicy.getOvertimeRate(isWeekend, isHoliday, isNightShift);

    res.json({
      requiresApproval,
      autoApproved: !requiresApproval,
      overtimeRate,
      policyName: activePolicy.name,
      approvalRequired: activePolicy.approvalRequired,
      reason: requiresApproval 
        ? `Nadgodziny przekraczają próg automatycznego zatwierdzenia (${activePolicy.autoApproveUnder}h)`
        : 'Nadgodziny w limicie automatycznego zatwierdzenia'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create default overtime policy for company
 */
exports.createDefaultPolicy = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą tworzyć polityki nadgodzin.' });
    }

    const company = companyId || userId;

    // Check if default policy already exists
    const existingPolicy = await OvertimePolicy.findOne({ company, name: 'Domyślna polityka nadgodzin' });
    if (existingPolicy) {
      return res.status(400).json({ message: 'Domyślna polityka nadgodzin już istnieje.' });
    }

    const policy = await OvertimePolicy.create({
      company,
      name: 'Domyślna polityka nadgodzin',
      description: 'Automatycznie utworzona polityka nadgodzin zgodna z Kodeksem Pracy',
      dailyOvertimeThreshold: 8,
      dailyOvertimeLimit: 12,
      weeklyOvertimeThreshold: 40,
      weeklyOvertimeLimit: 48,
      monthlyOvertimeLimit: 150,
      overtimeRate: 1.5,
      weekendOvertimeRate: 2.0,
      holidayOvertimeRate: 2.5,
      nightShiftOvertimeRate: 1.75,
      requiresApproval: true,
      autoApproveUnder: 2,
      approvalRequired: ['manager'],
      notifyManagerAt: 4,
      notifyHRAt: 8,
      sendWeeklyReport: true,
      sendMonthlyReport: true,
      alertAtBudgetPercentage: 80,
      allowConsecutiveOvertimeDays: true,
      maxConsecutiveOvertimeDays: 5,
      restrictOvertimeForPartTime: true,
      isActive: true,
      legalReference: 'Kodeks Pracy Art. 151'
    });

    res.status(201).json({ policy, message: 'Domyślna polityka nadgodzin została utworzona.' });
  } catch (err) {
    next(err);
  }
};

const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');
const Training = require('../models/Training');
const { createNotification } = require('../utils/notificationService');

exports.createOnboarding = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { employeeId, startDate, checklist, buddy, manager, trainings, documents } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie znaleziony' });
    }

    const onboarding = await Onboarding.create({
      employee: employeeId,
      startDate,
      checklist: checklist || [],
      buddy,
      manager: manager || userId,
      trainings: trainings || [],
      documents: documents || [],
      status: 'not_started',
    });

    onboarding.calculateCompletion();
    await onboarding.save();

    if (employee.user) {
      await createNotification({
        user: employee.user,
        type: 'general',
        title: 'Proces onboardingu rozpoczęty',
        message: `Twój proces wdrożenia rozpocznie się ${new Date(startDate).toLocaleDateString('pl-PL')}`,
      });
    }

    res.status(201).json({ onboarding });
  } catch (err) {
    next(err);
  }
};

exports.getOnboardings = async (req, res, next) => {
  try {
    const { status, employeeId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;

    const onboardings = await Onboarding.find(query)
      .populate('employee', 'firstName lastName position email')
      .populate('buddy', 'firstName lastName')
      .populate('manager', 'name email')
      .populate('trainings', 'title category')
      .sort({ startDate: -1 });

    res.json({ onboardings });
  } catch (err) {
    next(err);
  }
};

exports.getOnboarding = async (req, res, next) => {
  try {
    const { id } = req.params;

    const onboarding = await Onboarding.findById(id)
      .populate('employee', 'firstName lastName position email')
      .populate('buddy', 'firstName lastName email')
      .populate('manager', 'name email')
      .populate('trainings', 'title category duration')
      .populate('checklist.completedBy', 'name email')
      .populate('feedback.from', 'name email');

    if (!onboarding) {
      return res.status(404).json({ message: 'Onboarding nie znaleziony' });
    }

    res.json({ onboarding });
  } catch (err) {
    next(err);
  }
};

exports.getMyOnboarding = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const onboarding = await Onboarding.findOne({ employee: employee._id })
      .populate('buddy', 'firstName lastName email')
      .populate('manager', 'name email')
      .populate('trainings', 'title category duration')
      .populate('checklist.completedBy', 'name email');

    if (!onboarding) {
      return res.status(404).json({ message: 'Nie masz aktywnego procesu onboardingu' });
    }

    res.json({ onboarding });
  } catch (err) {
    next(err);
  }
};

exports.updateOnboarding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: 'Onboarding nie znaleziony' });
    }

    Object.assign(onboarding, req.body);
    onboarding.calculateCompletion();
    await onboarding.save();

    res.json({ onboarding });
  } catch (err) {
    next(err);
  }
};

exports.completeChecklistItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { id: userId } = req.user || {};
    const { notes } = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: 'Onboarding nie znaleziony' });
    }

    const item = onboarding.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Element checklist nie znaleziony' });
    }

    item.completed = true;
    item.completedAt = new Date();
    item.completedBy = userId;
    if (notes) item.notes = notes;

    onboarding.calculateCompletion();
    await onboarding.save();

    res.json({ onboarding });
  } catch (err) {
    next(err);
  }
};

exports.addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user || {};
    const { content, rating } = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: 'Onboarding nie znaleziony' });
    }

    onboarding.feedback.push({
      from: userId,
      content,
      rating,
      date: new Date(),
    });

    await onboarding.save();

    res.json({ onboarding });
  } catch (err) {
    next(err);
  }
};

exports.deleteOnboarding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const onboarding = await Onboarding.findByIdAndDelete(id);
    if (!onboarding) {
      return res.status(404).json({ message: 'Onboarding nie znaleziony' });
    }

    res.json({ message: 'Onboarding został usunięty' });
  } catch (err) {
    next(err);
  }
};

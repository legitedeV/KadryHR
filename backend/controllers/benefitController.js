const Benefit = require('../models/Benefit');
const BenefitEnrollment = require('../models/BenefitEnrollment');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationService');

exports.createBenefit = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const benefitData = { ...req.body, createdBy: userId };
    const benefit = await Benefit.create(benefitData);

    res.status(201).json({ benefit });
  } catch (err) {
    next(err);
  }
};

exports.getBenefits = async (req, res, next) => {
  try {
    const { category, type, isActive } = req.query;
    const query = {};

    if (category) query.category = category;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const benefits = await Benefit.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ benefits });
  } catch (err) {
    next(err);
  }
};

exports.getBenefit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const benefit = await Benefit.findById(id).populate('createdBy', 'name email');

    if (!benefit) {
      return res.status(404).json({ message: 'Benefit nie znaleziony' });
    }

    res.json({ benefit });
  } catch (err) {
    next(err);
  }
};

exports.updateBenefit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const benefit = await Benefit.findByIdAndUpdate(id, req.body, { new: true });

    if (!benefit) {
      return res.status(404).json({ message: 'Benefit nie znaleziony' });
    }

    res.json({ benefit });
  } catch (err) {
    next(err);
  }
};

exports.deleteBenefit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const benefit = await Benefit.findByIdAndDelete(id);

    if (!benefit) {
      return res.status(404).json({ message: 'Benefit nie znaleziony' });
    }

    res.json({ message: 'Benefit został usunięty' });
  } catch (err) {
    next(err);
  }
};

exports.enrollInBenefit = async (req, res, next) => {
  try {
    const { benefitId } = req.params;
    const { id: userId } = req.user || {};
    const { effectiveDate, dependents, notes } = req.body;

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const benefit = await Benefit.findById(benefitId);
    if (!benefit) {
      return res.status(404).json({ message: 'Benefit nie znaleziony' });
    }

    if (!benefit.isActive) {
      return res.status(400).json({ message: 'Ten benefit nie jest obecnie dostępny' });
    }

    const existingEnrollment = await BenefitEnrollment.findOne({
      benefit: benefitId,
      employee: employee._id,
      status: { $in: ['pending', 'active'] },
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Jesteś już zapisany na ten benefit' });
    }

    const enrollment = await BenefitEnrollment.create({
      benefit: benefitId,
      employee: employee._id,
      effectiveDate: effectiveDate || new Date(),
      dependents: dependents || [],
      notes,
      status: 'pending',
    });

    await createNotification({
      user: userId,
      type: 'general',
      title: 'Zgłoszenie do benefitu',
      message: `Twoje zgłoszenie do benefitu "${benefit.name}" zostało przyjęte i oczekuje na zatwierdzenie`,
    });

    res.status(201).json({ enrollment });
  } catch (err) {
    next(err);
  }
};

exports.getMyEnrollments = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const enrollments = await BenefitEnrollment.find({ employee: employee._id })
      .populate('benefit')
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (err) {
    next(err);
  }
};

exports.getEnrollments = async (req, res, next) => {
  try {
    const { benefitId, employeeId, status } = req.query;
    const query = {};

    if (benefitId) query.benefit = benefitId;
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;

    const enrollments = await BenefitEnrollment.find(query)
      .populate('benefit', 'name category type')
      .populate('employee', 'firstName lastName position')
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (err) {
    next(err);
  }
};

exports.updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};
    const { status, notes } = req.body;

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const enrollment = await BenefitEnrollment.findById(id).populate('employee benefit');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment nie znaleziony' });
    }

    enrollment.status = status;
    if (notes) enrollment.notes = notes;

    if (status === 'cancelled') {
      enrollment.cancelledAt = new Date();
      enrollment.cancellationReason = notes;
    }

    await enrollment.save();

    if (enrollment.employee.user) {
      await createNotification({
        user: enrollment.employee.user,
        type: 'general',
        title: 'Status benefitu zaktualizowany',
        message: `Status Twojego zgłoszenia do benefitu "${enrollment.benefit.name}" został zmieniony na: ${status}`,
      });
    }

    res.json({ enrollment });
  } catch (err) {
    next(err);
  }
};

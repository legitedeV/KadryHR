const Analytics = require('../models/Analytics');
const Employee = require('../models/Employee');
const PerformanceReview = require('../models/PerformanceReview');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Leave = require('../models/Leave');

exports.generateAnalytics = async (req, res, next) => {
  try {
    const { id: userId, role, organizationId } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Wymagane daty początkowa i końcowa' });
    }

    const orgId = organizationId || userId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const employees = await Employee.find({
      $or: [{ organization: orgId }, { companyId: orgId }],
    });

    const activeEmployees = employees.filter((e) => e.isActive);
    const inactiveEmployees = employees.filter((e) => !e.isActive);

    const newHires = employees.filter(
      (e) => e.createdAt >= start && e.createdAt <= end
    ).length;

    const reviews = await PerformanceReview.find({
      employee: { $in: employees.map((e) => e._id) },
      'reviewPeriod.endDate': { $gte: start, $lte: end },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
      : 0;

    const trainings = await TrainingEnrollment.find({
      employee: { $in: employees.map((e) => e._id) },
      completedAt: { $gte: start, $lte: end },
    });

    const totalTrainingHours = trainings.reduce((sum, t) => {
      return sum + (t.training?.duration || 0);
    }, 0);

    const completionRate = trainings.length > 0
      ? (trainings.filter((t) => t.status === 'completed').length / trainings.length) * 100
      : 0;

    const leaves = await Leave.find({
      employee: { $in: employees.map((e) => e._id) },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    const totalPayroll = activeEmployees.reduce((sum, e) => {
      return sum + (e.monthlySalary || e.hourlyRate * e.hoursPerMonth || 0);
    }, 0);

    const avgSalary = activeEmployees.length > 0
      ? totalPayroll / activeEmployees.length
      : 0;

    const analytics = await Analytics.create({
      organization: orgId,
      period: { startDate: start, endDate: end },
      metrics: {
        headcount: {
          total: employees.length,
          active: activeEmployees.length,
          inactive: inactiveEmployees.length,
          newHires,
          terminations: inactiveEmployees.length,
        },
        turnover: {
          rate: employees.length > 0 ? (inactiveEmployees.length / employees.length) * 100 : 0,
          voluntary: 0,
          involuntary: 0,
          avgTenure: 0,
        },
        attendance: {
          avgAttendanceRate: 95,
          totalAbsences: leaves.length,
          sickDays: leaves.filter((l) => l.type === 'sick').length,
          vacationDays: leaves.filter((l) => l.type === 'annual').length,
        },
        performance: {
          avgRating: Math.round(avgRating * 10) / 10,
          topPerformers: reviews.filter((r) => r.overallRating >= 4.5).length,
          needsImprovement: reviews.filter((r) => r.overallRating < 3).length,
          reviewsCompleted: reviews.length,
        },
        training: {
          totalHours: totalTrainingHours,
          completionRate: Math.round(completionRate),
          avgScores: 0,
          certificatesIssued: trainings.filter((t) => t.certificate?.issued).length,
        },
        engagement: {
          surveyParticipation: 0,
          avgEngagementScore: 0,
          eNPS: 0,
        },
        costs: {
          totalPayroll: Math.round(totalPayroll),
          avgSalary: Math.round(avgSalary),
          benefitsCost: 0,
          trainingCost: 0,
        },
        diversity: {
          genderRatio: {
            male: 0,
            female: 0,
            other: 0,
          },
          ageGroups: [],
        },
      },
      predictions: {
        turnoverRisk: [],
        skillsGaps: [],
        hiringNeeds: [],
      },
      generatedBy: userId,
    });

    res.status(201).json({ analytics });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const { id: userId, role, organizationId } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const orgId = organizationId || userId;

    const analytics = await Analytics.find({ organization: orgId })
      .populate('generatedBy', 'name email')
      .sort({ 'period.startDate': -1 })
      .limit(12);

    res.json({ analytics });
  } catch (err) {
    next(err);
  }
};

exports.getLatestAnalytics = async (req, res, next) => {
  try {
    const { id: userId, role, organizationId } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const orgId = organizationId || userId;

    const analytics = await Analytics.findOne({ organization: orgId })
      .populate('generatedBy', 'name email')
      .sort({ generatedAt: -1 });

    if (!analytics) {
      return res.status(404).json({ message: 'Brak dostępnych analiz' });
    }

    res.json({ analytics });
  } catch (err) {
    next(err);
  }
};

exports.deleteAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const analytics = await Analytics.findByIdAndDelete(id);

    if (!analytics) {
      return res.status(404).json({ message: 'Analiza nie znaleziona' });
    }

    res.json({ message: 'Analiza została usunięta' });
  } catch (err) {
    next(err);
  }
};

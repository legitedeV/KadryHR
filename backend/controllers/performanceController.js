const PerformanceReview = require('../models/PerformanceReview');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationService');

exports.createReview = async (req, res, next) => {
  try {
    const { id: reviewerId, role } = req.user || {};
    const {
      employeeId,
      reviewPeriod,
      reviewType,
      ratings,
      strengths,
      areasForImprovement,
      goals,
      reviewerComments,
    } = req.body;

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień do tworzenia ocen' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie znaleziony' });
    }

    const overallRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    const review = await PerformanceReview.create({
      employee: employeeId,
      reviewer: reviewerId,
      reviewPeriod,
      reviewType: reviewType || 'quarterly',
      ratings,
      overallRating: Math.round(overallRating * 10) / 10,
      strengths: strengths || [],
      areasForImprovement: areasForImprovement || [],
      goals: goals || [],
      reviewerComments,
      status: 'pending',
    });

    if (employee.user) {
      await createNotification({
        user: employee.user,
        type: 'general',
        title: 'Nowa ocena pracownicza',
        message: `Otrzymałeś nową ocenę pracowniczą za okres ${new Date(reviewPeriod.startDate).toLocaleDateString('pl-PL')} - ${new Date(reviewPeriod.endDate).toLocaleDateString('pl-PL')}`,
      });
    }

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};
    const { employeeId, status, reviewType } = req.query;

    const query = {};

    if (role !== 'admin' && role !== 'super_admin') {
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return res.status(404).json({ message: 'Brak powiązanego pracownika' });
      }
      query.employee = employee._id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (status) query.status = status;
    if (reviewType) query.reviewType = reviewType;

    const reviews = await PerformanceReview.find(query)
      .populate('employee', 'firstName lastName position')
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
};

exports.getReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user || {};

    const review = await PerformanceReview.findById(id)
      .populate('employee', 'firstName lastName position email')
      .populate('reviewer', 'name email')
      .populate('acknowledgedBy', 'name email');

    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    if (role !== 'admin' && role !== 'super_admin') {
      const employee = await Employee.findOne({ user: userId });
      if (!employee || review.employee._id.toString() !== employee._id.toString()) {
        return res.status(403).json({ message: 'Brak dostępu do tej oceny' });
      }
    }

    res.json({ review });
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};
    const updates = req.body;

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień do edycji ocen' });
    }

    const review = await PerformanceReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    Object.assign(review, updates);

    if (updates.ratings && updates.ratings.length > 0) {
      const overallRating = updates.ratings.reduce((sum, r) => sum + r.rating, 0) / updates.ratings.length;
      review.overallRating = Math.round(overallRating * 10) / 10;
    }

    await review.save();

    res.json({ review });
  } catch (err) {
    next(err);
  }
};

exports.acknowledgeReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user || {};
    const { employeeComments } = req.body;

    const review = await PerformanceReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    const employee = await Employee.findOne({ user: userId });
    if (!employee || review.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Brak dostępu do tej oceny' });
    }

    review.status = 'acknowledged';
    review.acknowledgedAt = new Date();
    review.acknowledgedBy = userId;
    if (employeeComments) {
      review.employeeComments = employeeComments;
    }

    await review.save();

    res.json({ review });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień do usuwania ocen' });
    }

    const review = await PerformanceReview.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    res.json({ message: 'Ocena została usunięta' });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeReviewHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { id: userId, role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      const employee = await Employee.findOne({ user: userId });
      if (!employee || employee._id.toString() !== employeeId) {
        return res.status(403).json({ message: 'Brak dostępu' });
      }
    }

    const reviews = await PerformanceReview.find({ employee: employeeId })
      .populate('reviewer', 'name email')
      .sort({ 'reviewPeriod.endDate': -1 });

    const stats = {
      totalReviews: reviews.length,
      avgRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
        : 0,
      latestReview: reviews[0] || null,
    };

    res.json({ reviews, stats });
  } catch (err) {
    next(err);
  }
};

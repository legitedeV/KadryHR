const Training = require('../models/Training');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationService');

exports.createTraining = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};
    
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień do tworzenia szkoleń' });
    }

    const trainingData = { ...req.body, createdBy: userId };
    const training = await Training.create(trainingData);

    if (req.body.assignedTo && req.body.assignedTo.length > 0) {
      const enrollments = req.body.assignedTo.map(empId => ({
        training: training._id,
        employee: empId,
        status: 'not_started',
      }));

      await TrainingEnrollment.insertMany(enrollments);

      for (const empId of req.body.assignedTo) {
        const employee = await Employee.findById(empId);
        if (employee && employee.user) {
          await createNotification({
            user: employee.user,
            type: 'general',
            title: 'Nowe szkolenie przypisane',
            message: `Zostało Ci przypisane szkolenie: ${training.title}`,
          });
        }
      }
    }

    res.status(201).json({ training });
  } catch (err) {
    next(err);
  }
};

exports.getTrainings = async (req, res, next) => {
  try {
    const { category, type, isActive } = req.query;
    const query = {};

    if (category) query.category = category;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const trainings = await Training.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ trainings });
  } catch (err) {
    next(err);
  }
};

exports.getTraining = async (req, res, next) => {
  try {
    const { id } = req.params;

    const training = await Training.findById(id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'firstName lastName position');

    if (!training) {
      return res.status(404).json({ message: 'Szkolenie nie znalezione' });
    }

    res.json({ training });
  } catch (err) {
    next(err);
  }
};

exports.updateTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const training = await Training.findByIdAndUpdate(id, req.body, { new: true });

    if (!training) {
      return res.status(404).json({ message: 'Szkolenie nie znalezione' });
    }

    res.json({ training });
  } catch (err) {
    next(err);
  }
};

exports.deleteTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    await TrainingEnrollment.deleteMany({ training: id });
    const training = await Training.findByIdAndDelete(id);

    if (!training) {
      return res.status(404).json({ message: 'Szkolenie nie znalezione' });
    }

    res.json({ message: 'Szkolenie zostało usunięte' });
  } catch (err) {
    next(err);
  }
};

exports.getMyTrainings = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const enrollments = await TrainingEnrollment.find({ employee: employee._id })
      .populate('training')
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (err) {
    next(err);
  }
};

exports.startTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const enrollment = await TrainingEnrollment.findOne({
      training: id,
      employee: employee._id,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Nie jesteś zapisany na to szkolenie' });
    }

    if (enrollment.status === 'not_started') {
      enrollment.status = 'in_progress';
      enrollment.startedAt = new Date();
      await enrollment.save();
    }

    res.json({ enrollment });
  } catch (err) {
    next(err);
  }
};

exports.submitQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user || {};
    const { answers } = req.body;

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const enrollment = await TrainingEnrollment.findOne({
      training: id,
      employee: employee._id,
    }).populate('training');

    if (!enrollment) {
      return res.status(404).json({ message: 'Nie jesteś zapisany na to szkolenie' });
    }

    const training = enrollment.training;
    let score = 0;
    let totalPoints = 0;
    const processedAnswers = [];

    training.quiz.forEach((question, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) {
        score += question.points || 1;
      }
      totalPoints += question.points || 1;
      processedAnswers.push({
        questionIndex: idx,
        selectedAnswer: userAnswer,
        isCorrect,
      });
    });

    const percentageScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentageScore >= training.passingScore;

    enrollment.quizAttempts.push({
      attemptedAt: new Date(),
      score: percentageScore,
      answers: processedAnswers,
      passed,
    });

    if (percentageScore > enrollment.bestScore) {
      enrollment.bestScore = percentageScore;
    }

    if (passed) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      enrollment.progress = 100;
      enrollment.certificate.issued = true;
      enrollment.certificate.issuedAt = new Date();
    } else {
      enrollment.status = 'failed';
    }

    await enrollment.save();

    res.json({
      enrollment,
      result: {
        score: percentageScore,
        passed,
        correctAnswers: score,
        totalQuestions: training.quiz.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getEnrollments = async (req, res, next) => {
  try {
    const { trainingId, employeeId, status } = req.query;
    const query = {};

    if (trainingId) query.training = trainingId;
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;

    const enrollments = await TrainingEnrollment.find(query)
      .populate('training', 'title category duration')
      .populate('employee', 'firstName lastName position')
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (err) {
    next(err);
  }
};

const Wellness = require('../models/Wellness');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationService');

exports.createWellnessProgram = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const programData = { ...req.body, createdBy: userId };
    const program = await Wellness.create(programData);

    res.status(201).json({ program });
  } catch (err) {
    next(err);
  }
};

exports.getWellnessPrograms = async (req, res, next) => {
  try {
    const { category, type, isActive } = req.query;
    const query = {};

    if (category) query.category = category;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const programs = await Wellness.find(query)
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    res.json({ programs });
  } catch (err) {
    next(err);
  }
};

exports.getWellnessProgram = async (req, res, next) => {
  try {
    const { id } = req.params;

    const program = await Wellness.findById(id)
      .populate('createdBy', 'name email')
      .populate('participants.employee', 'firstName lastName position');

    if (!program) {
      return res.status(404).json({ message: 'Program wellness nie znaleziony' });
    }

    res.json({ program });
  } catch (err) {
    next(err);
  }
};

exports.updateWellnessProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const program = await Wellness.findByIdAndUpdate(id, req.body, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program wellness nie znaleziony' });
    }

    res.json({ program });
  } catch (err) {
    next(err);
  }
};

exports.deleteWellnessProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const program = await Wellness.findByIdAndDelete(id);

    if (!program) {
      return res.status(404).json({ message: 'Program wellness nie znaleziony' });
    }

    res.json({ message: 'Program wellness został usunięty' });
  } catch (err) {
    next(err);
  }
};

exports.joinProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const program = await Wellness.findById(id);
    if (!program) {
      return res.status(404).json({ message: 'Program wellness nie znaleziony' });
    }

    if (!program.isActive) {
      return res.status(400).json({ message: 'Ten program nie jest obecnie aktywny' });
    }

    const alreadyJoined = program.participants.some(
      (p) => p.employee.toString() === employee._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: 'Już uczestniczysz w tym programie' });
    }

    program.participants.push({
      employee: employee._id,
      joinedAt: new Date(),
      progress: 0,
      completed: false,
      points: 0,
    });

    await program.save();

    await createNotification({
      user: userId,
      type: 'general',
      title: 'Dołączono do programu wellness',
      message: `Pomyślnie dołączyłeś do programu: ${program.title}`,
    });

    res.json({ program });
  } catch (err) {
    next(err);
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user || {};
    const { progress, points } = req.body;

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const program = await Wellness.findById(id);
    if (!program) {
      return res.status(404).json({ message: 'Program wellness nie znaleziony' });
    }

    const participant = program.participants.find(
      (p) => p.employee.toString() === employee._id.toString()
    );

    if (!participant) {
      return res.status(404).json({ message: 'Nie uczestniczysz w tym programie' });
    }

    if (progress !== undefined) {
      participant.progress = Math.min(100, Math.max(0, progress));
      if (participant.progress === 100 && !participant.completed) {
        participant.completed = true;
        participant.completedAt = new Date();

        await createNotification({
          user: userId,
          type: 'general',
          title: 'Program wellness ukończony!',
          message: `Gratulacje! Ukończyłeś program: ${program.title}`,
        });
      }
    }

    if (points !== undefined) {
      participant.points += points;
    }

    await program.save();

    res.json({ program });
  } catch (err) {
    next(err);
  }
};

exports.getMyPrograms = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Brak powiązanego pracownika' });
    }

    const programs = await Wellness.find({
      'participants.employee': employee._id,
    }).populate('createdBy', 'name email');

    const myPrograms = programs.map((program) => {
      const participant = program.participants.find(
        (p) => p.employee.toString() === employee._id.toString()
      );
      return {
        ...program.toObject(),
        myProgress: participant,
      };
    });

    res.json({ programs: myPrograms });
  } catch (err) {
    next(err);
  }
};

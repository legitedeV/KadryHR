const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');

/**
 * Get all tasks (admin view with filters)
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Build query
    const query = {};

    // Multi-tenant: filter by company
    if (companyId) {
      query.company = companyId;
    } else if (role === 'admin' || role === 'super_admin') {
      query.company = userId;
    }

    // Filters from query params
    const { employeeId, status, priority, startDate, endDate } = req.query;

    if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        query.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dueDate.$lte = new Date(endDate);
      }
    }

    const tasks = await Task.find(query)
      .populate('employee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(500);

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

/**
 * Get my tasks (employee view)
 */
exports.getMyTasks = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const tasks = await Task.find({ employee: userId })
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(200);

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single task
 */
exports.getTask = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const task = await Task.findById(id)
      .populate('employee', 'name email')
      .populate('createdBy', 'name email')
      .populate('company', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Zadanie nie istnieje.' });
    }

    // Check permissions
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isEmployee = task.employee._id.toString() === userId.toString();
    const isCreator = task.createdBy._id.toString() === userId.toString();

    if (!isAdmin && !isEmployee && !isCreator) {
      return res.status(403).json({ message: 'Brak uprawnień do tego zadania.' });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
};

/**
 * Create task (admin only)
 */
exports.createTask = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can create tasks
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą tworzyć zadania.' });
    }

    const { title, description, employeeId, dueDate, priority, scheduledDate } = req.body;

    if (!title || !description || !employeeId || !dueDate) {
      return res.status(400).json({ message: 'Tytuł, opis, pracownik i data wykonania są wymagane.' });
    }

    // Verify employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie istnieje.' });
    }

    // Determine company
    const company = companyId || userId;

    const task = await Task.create({
      title,
      description,
      employee: employeeId,
      company,
      dueDate: new Date(dueDate),
      createdBy: userId,
      priority: priority || 'medium',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: 'assigned'
    });

    // Populate fields
    await task.populate('employee', 'name email');
    await task.populate('createdBy', 'name email');

    // Create notification for employee
    await createNotification(
      employeeId,
      'general',
      'Nowe zadanie',
      `Przypisano Ci nowe zadanie: ${title}`
    );

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

/**
 * Update task (admin only)
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can update tasks
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą edytować zadania.' });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Zadanie nie istnieje.' });
    }

    const { title, description, dueDate, priority, status, scheduledDate } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (scheduledDate !== undefined) task.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;

    await task.save();
    await task.populate('employee', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ task });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete task (admin only)
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    // Only admins can delete tasks
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Tylko administratorzy mogą usuwać zadania.' });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Zadanie nie istnieje.' });
    }

    await Task.findByIdAndDelete(id);

    res.json({ message: 'Zadanie zostało usunięte.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Complete task (employee action)
 */
exports.completeTask = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Zadanie nie istnieje.' });
    }

    // Only assigned employee can complete
    if (task.employee.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Tylko przypisany pracownik może potwierdzić wykonanie.' });
    }

    const { comment, attachmentUrl } = req.body;

    task.status = new Date() > task.dueDate ? 'completed_late' : 'completed';
    task.completedAt = new Date();
    task.employeeComment = comment || '';
    if (attachmentUrl) {
      task.attachmentUrl = attachmentUrl;
    }

    await task.save();
    await task.populate('employee', 'name email');
    await task.populate('createdBy', 'name email');

    // Notify creator
    await createNotification(
      task.createdBy._id,
      'general',
      'Zadanie wykonane',
      `${task.employee.name} potwierdził wykonanie zadania: ${task.title}`
    );

    res.json({ task });
  } catch (err) {
    next(err);
  }
};

/**
 * Reject task (employee action)
 */
exports.rejectTask = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Zadanie nie istnieje.' });
    }

    // Only assigned employee can reject
    if (task.employee.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Tylko przypisany pracownik może odrzucić zadanie.' });
    }

    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Komentarz jest wymagany przy odrzuceniu zadania.' });
    }

    task.status = 'rejected';
    task.employeeComment = comment;

    await task.save();
    await task.populate('employee', 'name email');
    await task.populate('createdBy', 'name email');

    // Notify creator
    await createNotification(
      task.createdBy._id,
      'general',
      'Zadanie odrzucone',
      `${task.employee.name} odrzucił zadanie: ${task.title}`
    );

    res.json({ task });
  } catch (err) {
    next(err);
  }
};

/**
 * Get tasks for schedule (by employee and date range)
 */
exports.getTasksForSchedule = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ message: 'employeeId, startDate i endDate są wymagane.' });
    }

    const query = {
      employee: employeeId,
      $or: [
        {
          scheduledDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          dueDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ]
    };

    // Multi-tenant filter
    if (companyId) {
      query.company = companyId;
    } else if (role === 'admin' || role === 'super_admin') {
      query.company = userId;
    }

    const tasks = await Task.find(query)
      .select('title status priority dueDate scheduledDate')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

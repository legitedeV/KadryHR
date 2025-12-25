const express = require('express');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Get all tasks (admin with filters)
router.get('/', taskController.getTasks);

// Get my tasks (employee)
router.get('/my', taskController.getMyTasks);

// Get employees for task assignment
router.get('/employees', taskController.getTaskEmployees);

// Get tasks for schedule builder
router.get('/schedule', taskController.getTasksForSchedule);

// Get single task
router.get('/:id', taskController.getTask);

// Create task (admin only)
router.post('/', taskController.createTask);

// Update task (admin only)
router.patch('/:id', taskController.updateTask);

// Delete task (admin only)
router.delete('/:id', taskController.deleteTask);

// Complete task (employee action)
router.post('/:id/complete', taskController.completeTask);

// Reject task (employee action)
router.post('/:id/reject', taskController.rejectTask);

module.exports = router;

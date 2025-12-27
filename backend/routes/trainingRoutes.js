const express = require('express');
const trainingController = require('../controllers/trainingController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requirePermission('training.manage', { allowAdmin: true }), trainingController.createTraining);
router.get('/', trainingController.getTrainings);
router.get('/my', trainingController.getMyTrainings);
router.get('/enrollments', requirePermission('training.manage', { allowAdmin: true }), trainingController.getEnrollments);
router.get('/:id', trainingController.getTraining);
router.put('/:id', requirePermission('training.manage', { allowAdmin: true }), trainingController.updateTraining);
router.delete('/:id', requirePermission('training.manage', { allowAdmin: true }), trainingController.deleteTraining);
router.post('/:id/start', trainingController.startTraining);
router.post('/:id/submit-quiz', trainingController.submitQuiz);

module.exports = router;

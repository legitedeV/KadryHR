const express = require('express');
const performanceController = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requirePermission('performance.manage', { allowAdmin: true }), performanceController.createReview);
router.get('/', performanceController.getReviews);
router.get('/:id', performanceController.getReview);
router.put('/:id', requirePermission('performance.manage', { allowAdmin: true }), performanceController.updateReview);
router.delete('/:id', requirePermission('performance.manage', { allowAdmin: true }), performanceController.deleteReview);
router.post('/:id/acknowledge', performanceController.acknowledgeReview);
router.get('/employee/:employeeId/history', performanceController.getEmployeeReviewHistory);

module.exports = router;

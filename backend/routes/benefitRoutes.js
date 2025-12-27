const express = require('express');
const benefitController = require('../controllers/benefitController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requirePermission('benefits.manage', { allowAdmin: true }), benefitController.createBenefit);
router.get('/', benefitController.getBenefits);
router.get('/my-enrollments', benefitController.getMyEnrollments);
router.get('/enrollments', requirePermission('benefits.manage', { allowAdmin: true }), benefitController.getEnrollments);
router.get('/:id', benefitController.getBenefit);
router.put('/:id', requirePermission('benefits.manage', { allowAdmin: true }), benefitController.updateBenefit);
router.delete('/:id', requirePermission('benefits.manage', { allowAdmin: true }), benefitController.deleteBenefit);
router.post('/:benefitId/enroll', benefitController.enrollInBenefit);
router.patch('/enrollments/:id/status', requirePermission('benefits.manage', { allowAdmin: true }), benefitController.updateEnrollmentStatus);

module.exports = router;

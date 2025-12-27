const express = require('express');
const overtimePolicyController = require('../controllers/overtimePolicyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Get all overtime policies
router.get('/', overtimePolicyController.getOvertimePolicies);

// Create default policy
router.post('/default', overtimePolicyController.createDefaultPolicy);

// Check overtime approval requirements
router.post('/check-approval', overtimePolicyController.checkOvertimeApproval);

// Get active policy for employee
router.get('/employee/:employeeId', overtimePolicyController.getActivePolicyForEmployee);

// Get single overtime policy
router.get('/:id', overtimePolicyController.getOvertimePolicy);

// Create overtime policy (admin only)
router.post('/', overtimePolicyController.createOvertimePolicy);

// Update overtime policy (admin only)
router.patch('/:id', overtimePolicyController.updateOvertimePolicy);

// Delete overtime policy (admin only)
router.delete('/:id', overtimePolicyController.deleteOvertimePolicy);

module.exports = router;

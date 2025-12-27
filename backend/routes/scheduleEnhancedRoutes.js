/**
 * Enhanced Schedule Routes
 * Uses new service layer, validation, and multi-tenant middleware
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const withTenant = require('../middleware/withTenant');
const { validate, publishScheduleSchema, conflictCheckSchema, bulkOperationSchema } = require('../validators/shiftValidators');
const scheduleEnhancedController = require('../controllers/scheduleEnhancedController');

// Apply auth and tenant middleware to all routes
router.use(authMiddleware);
router.use(withTenant);

/**
 * Publish schedule
 * POST /api/schedules/:id/publish
 */
router.post(
  '/:id/publish',
  validate(publishScheduleSchema),
  scheduleEnhancedController.publishSchedule
);

/**
 * Check for conflicts
 * POST /api/schedules/check-conflicts
 */
router.post(
  '/check-conflicts',
  validate(conflictCheckSchema),
  scheduleEnhancedController.checkConflicts
);

/**
 * Bulk operations
 */

// Copy week
router.post(
  '/bulk/copy-week',
  validate(bulkOperationSchema),
  scheduleEnhancedController.copyWeek
);

// Apply template
router.post(
  '/bulk/apply-template',
  validate(bulkOperationSchema),
  scheduleEnhancedController.applyTemplate
);

// Delete range
router.post(
  '/bulk/delete-range',
  validate(bulkOperationSchema),
  scheduleEnhancedController.deleteRange
);

/**
 * Statistics and reports
 */

// Get schedule statistics
router.get(
  '/:id/stats',
  scheduleEnhancedController.getScheduleStats
);

// Get time comparison (planned vs actual)
router.get(
  '/:id/time-comparison',
  scheduleEnhancedController.getTimeComparison
);

module.exports = router;

const express = require('express');
const onboardingController = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requirePermission('onboarding.manage', { allowAdmin: true }), onboardingController.createOnboarding);
router.get('/', requirePermission('onboarding.view', { allowAdmin: true }), onboardingController.getOnboardings);
router.get('/my', onboardingController.getMyOnboarding);
router.get('/:id', onboardingController.getOnboarding);
router.put('/:id', requirePermission('onboarding.manage', { allowAdmin: true }), onboardingController.updateOnboarding);
router.delete('/:id', requirePermission('onboarding.manage', { allowAdmin: true }), onboardingController.deleteOnboarding);
router.post('/:id/checklist/:itemId/complete', onboardingController.completeChecklistItem);
router.post('/:id/feedback', onboardingController.addFeedback);

module.exports = router;

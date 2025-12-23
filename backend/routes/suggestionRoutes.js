const express = require('express');
const suggestionController = require('../controllers/suggestionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', suggestionController.createSuggestion);
router.get('/', suggestionController.getSuggestions);
router.patch('/:id/status', adminOnly, suggestionController.updateSuggestionStatus);
router.post('/:id/approve', adminOnly, suggestionController.approveSuggestion);
router.post('/:id/reject', adminOnly, suggestionController.rejectSuggestion);

module.exports = router;

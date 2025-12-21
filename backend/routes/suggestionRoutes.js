const express = require('express');
const suggestionController = require('../controllers/suggestionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', suggestionController.createSuggestion);
router.get('/', suggestionController.getSuggestions);
router.patch('/:id/status', suggestionController.updateSuggestionStatus);

module.exports = router;

const express = require('express');
const swapController = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', swapController.createSwapRequest);
router.get('/', swapController.getSwapRequests);
router.patch('/:id/status', swapController.updateSwapStatus);

module.exports = router;

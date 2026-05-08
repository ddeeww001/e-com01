const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { authGuard } = require('../middleware/authMiddleware');

router.post('/calculate-total', authGuard, checkoutController.calculateTotal);
router.post('/place-order', authGuard, checkoutController.placeOrder);
router.get('/profile', authGuard, checkoutController.getProfile);
router.post('/save-profile', authGuard, checkoutController.saveProfile);

module.exports = router;

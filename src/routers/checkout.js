const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/db');

// Middleware: Auth Guard with Revocation Check
async function authGuard(req, res, next) {
    const SECRET = req.app.get('jwt_secret');
    const token = req.cookies.sunToken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        
        // 🔥 Phase 1, Item 4: JWT Revocation Check
        const db = await dbConfig.getUserDB();
        const user = await db.get('SELECT password_version FROM users WHERE id = ?', [decoded.id]);
        
        if (!user || user.password_version !== decoded.version) {
            return res.status(401).json({ message: 'Unauthorized: Session invalidated' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

// Routes... (keep existing ones but use the updated authGuard)
// Note: Since this file uses the local authGuard, the updates below will apply to all checkout routes.

const checkoutController = require('../controllers/checkoutController');

router.post('/calculate-total', authGuard, checkoutController.calculateTotal);
router.post('/place-order', authGuard, checkoutController.placeOrder);
router.get('/profile', authGuard, checkoutController.getProfile);
router.post('/save-profile', authGuard, checkoutController.saveProfile);

module.exports = router;

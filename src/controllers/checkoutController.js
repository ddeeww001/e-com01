const checkoutService = require('../services/checkoutService');
const asyncHandler = require('express-async-handler');

/**
 * 🔥 Phase 3, Item 8: Centralized Error Handling using express-async-handler
 * This removes the need for try/catch in every controller.
 */

const calculateTotal = asyncHandler(async (req, res) => {
    const { cart } = req.body;
    if (!Array.isArray(cart)) return res.status(400).json({ message: 'Invalid cart' });

    // 🔥 DoS Protection: Limit cart size
    if (cart.length > 50) {
        return res.status(400).json({ message: 'Cart too large (Max 50 items)' });
    }

    const result = await checkoutService.calculateTotal(cart);
    res.json(result);
});

const placeOrder = asyncHandler(async (req, res) => {
    const { cart, profile, paymentMethod, creditCardNumber, expectedTotal } = req.body;
    
    // 🔥 DoS Protection: Limit cart size
    if (Array.isArray(cart) && cart.length > 50) {
        return res.status(400).json({ error: { general: 'ตะกร้าสินค้าใหญ่เกินไป (สูงสุด 50 รายการ)' } });
    }

    // 💡 Logic Check: expectedTotal validation
    if (!Array.isArray(cart) || cart.length === 0 || !profile) {
        return res.status(400).json({ error: { general: 'ข้อมูลการสั่งซื้อไม่สมบูรณ์' } });
    }

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.emailaddress || !emailRegex.test(profile.emailaddress)) {
        errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (paymentMethod === 'card') {
        if (!creditCardNumber || !/^\d{16}$/.test(creditCardNumber)) {
            errors.payment = "หมายเลขบัตรเครดิตต้องมี 16 หลัก";
        }
    }

    if (Object.keys(errors).length > 0) return res.status(400).json({ error: errors });

    const result = await checkoutService.placeOrder(req.user.id, req.user.username, { cart, profile, paymentMethod, expectedTotal });
    
    if (result.error) {
        return res.status(400).json({ error: { stock: result.error } });
    }
    
    res.json(result);
});

const getProfile = asyncHandler(async (req, res) => {
    const profile = await checkoutService.getProfile(req.user.id);
    res.json(profile);
});

const saveProfile = asyncHandler(async (req, res) => {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ message: 'ไม่มีข้อมูล' });

    const result = await checkoutService.saveProfile(req.user.id, req.user.username, profile);
    res.json(result);
});

module.exports = {
    calculateTotal,
    placeOrder,
    getProfile,
    saveProfile
};

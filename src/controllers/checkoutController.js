const checkoutService = require('../services/checkoutService');

const calculateTotal = async (req, res) => {
    const { cart } = req.body;
    if (!Array.isArray(cart)) return res.status(400).json({ message: 'Invalid cart' });

    try {
        const result = await checkoutService.calculateTotal(cart);
        res.json(result);
    } catch (err) {
        console.error("Calculate Total Error:", err);
        res.status(500).json({ message: 'Calculation error' });
    }
};

const placeOrder = async (req, res) => {
    const { cart, profile, paymentMethod, creditCardNumber } = req.body;
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

    try {
        const result = await checkoutService.placeOrder(req.user.id, req.user.username, { cart, profile, paymentMethod });
        if (result.error) {
            return res.status(400).json({ error: { stock: result.error } });
        }
        res.json(result);
    } catch (err) {
        console.error("Place Order Error:", err);
        res.status(500).json({ error: { general: 'Server Error' } });
    }
};

const getProfile = async (req, res) => {
    try {
        const profile = await checkoutService.getProfile(req.user.id);
        res.json(profile);
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.json({});
    }
};

const saveProfile = async (req, res) => {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ message: 'ไม่มีข้อมูล' });

    try {
        const result = await checkoutService.saveProfile(req.user.id, req.user.username, profile);
        res.json(result);
    } catch (err) {
        console.error("Save Profile Error:", err);
        res.status(500).json({ message: 'Error' });
    }
};

module.exports = {
    calculateTotal,
    placeOrder,
    getProfile,
    saveProfile
};

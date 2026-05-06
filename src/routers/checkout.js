const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const PRODUCTS_FILE = path.join(__dirname, '../../data/products.json');
const USER_PROFILE_FILE = path.join(__dirname, '../../data/user_profiles.json');
const ORDER_HISTORY_FILE = path.join(__dirname, '../../data/order_history.json');
const SECRET = "SUN_PRO_SECURE_KEY_2026";

// Middleware: Auth Guard
function authGuard(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

// POST /api/checkout/calculate-total
router.post('/calculate-total', authGuard, async (req, res) => {
    const { cart } = req.body;
    if (!Array.isArray(cart)) return res.status(400).json({ message: 'Invalid cart' });

    try {
        const productsData = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        let total = 0;
        const validation = cart.map(item => {
            const product = productsData.find(p => p.id === item.productId);
            if (!product) return { productId: item.productId, error: 'Not found' };
            
            const isAvailable = product.stock_quantity >= item.quantity;
            if (isAvailable) {
                total += product.price * item.quantity;
            }
            return {
                productId: item.productId,
                available: isAvailable,
                currentStock: product.stock_quantity
            };
        });
        res.json({ total, validation });
    } catch (err) { res.status(500).json({ message: 'Calculation error' }); }
});

// POST /api/checkout/place-order
// 🌟 Phase 3: Validation Logic + Total Calculation + Stock Cutting
router.post('/place-order', authGuard, async (req, res) => {
    const { cart, profile, paymentMethod, creditCardNumber } = req.body;
    
    // 1. Initial Data Check
    if (!Array.isArray(cart) || cart.length === 0 || !profile) {
        return res.status(400).json({ 
            error: { general: 'ข้อมูลการสั่งซื้อไม่สมบูรณ์ หรือตะกร้าว่างเปล่า' } 
        });
    }

    const errors = {};

    try {
        // 2. Email Validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profile.emailaddress || !emailRegex.test(profile.emailaddress)) {
            errors.email = "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
        }

        // 3. Payment Validation (Credit Card 16 digits)
        // ตรวจสอบเฉพาะกรณีเลือกชำระผ่านบัตรเครดิต (Card Payment)
        if (paymentMethod === 'card') {
            const cardRegex = /^\d{16}$/;
            if (!creditCardNumber || !cardRegex.test(creditCardNumber)) {
                errors.payment = "หมายเลขบัตรเครดิตต้องเป็นตัวเลข 16 หลักเท่านั้น";
            }
        }

        // 4. Products & Stock Validation + Server-side Calculation
        let products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        let totalAmount = 0;
        const stockErrors = [];

        for (const item of cart) {
            const prod = products.find(p => p.id === (item.id || item.productId));
            if (!prod) {
                stockErrors.push(`ไม่พบสินค้า ID: ${item.id || item.productId}`);
                continue;
            }

            // ตรวจสอบสต็อก
            if (prod.stock_quantity < item.quantity) {
                stockErrors.push(`สินค้า "${prod.title}" มีสต็อกไม่เพียงพอ (คงเหลือ: ${prod.stock_quantity})`);
            } else {
                // คำนวณราคากลางจากเซิร์ฟเวอร์ (Security Requirement)
                totalAmount += prod.price * item.quantity;
            }
        }

        if (stockErrors.length > 0) {
            errors.stock = stockErrors.join(', ');
        }

        // 5. Check for any validation errors
        if (Object.keys(errors).length > 0) {
            // ส่งกลับสถานะ 400 พร้อมรายละเอียด Error แยกตามฟิลด์
            return res.status(400).json({ error: errors });
        }

        // 6. Success Logic: Stock Deduction (Stock Cutting)
        products = products.map(p => {
            const item = cart.find(i => (i.id || i.productId) === p.id);
            if (item) {
                return { ...p, stock_quantity: p.stock_quantity - item.quantity };
            }
            return p;
        });
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));

        // 7. Save Order History
        let history = [];
        try {
            const historyContent = await fs.readFile(ORDER_HISTORY_FILE, 'utf8');
            history = JSON.parse(historyContent);
        } catch (e) { history = []; }

        const orderId = "ORD-" + Date.now() + Math.floor(Math.random() * 1000);
        const newOrder = {
            orderId,
            userId: req.user.id,
            username: req.user.username || profile.username || 'Guest', // ใช้ชื่อจาก Token หรือ Profile
            email: profile.emailaddress,
            items: cart.map(item => {
                const p = products.find(prod => prod.id === (item.id || item.productId));
                return {
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    quantity: item.quantity
                };
            }),
            totalAmount,
            profile,
            paymentMethod,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        history.push(newOrder);
        await fs.writeFile(ORDER_HISTORY_FILE, JSON.stringify(history, null, 2));

        // 8. Auto-update User Profile for next time
        let profiles = [];
        try {
            profiles = JSON.parse(await fs.readFile(USER_PROFILE_FILE, 'utf8'));
        } catch { profiles = []; }
        
        const pIdx = profiles.findIndex(p => p.userId === req.user.id);
        const profileToSave = { ...profile, userId: req.user.id };
        if (pIdx >= 0) profiles[pIdx] = profileToSave;
        else profiles.push(profileToSave);
        await fs.writeFile(USER_PROFILE_FILE, JSON.stringify(profiles, null, 2));

        // Return success response
        res.json({ 
            success: true, 
            orderId, 
            totalAmount,
            message: 'Order placed successfully' 
        });

    } catch (err) {
        console.error("Checkout Error:", err);
        res.status(500).json({ 
            error: { general: 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' } 
        });
    }
});

router.get('/profile', authGuard, async (req, res) => {
    try {
        const profiles = JSON.parse(await fs.readFile(USER_PROFILE_FILE, 'utf8'));
        const profile = profiles.find(p => p.userId === req.user.id);
        res.json(profile || {});
    } catch { res.json({}); }
});

module.exports = router;
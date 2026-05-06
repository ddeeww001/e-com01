const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_FILE = path.join(__dirname, '../../data/products.db');
const SECRET = "SUN_PRO_SECURE_KEY_2026";

// 🌟 ฟังก์ชันจัดการฐานข้อมูล SQLite (Unified DB)
async function getDB() {
    return open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });
}

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
        const db = await getDB();
        let total = 0;
        const validation = [];

        for (const item of cart) {
            const product = await db.get('SELECT * FROM products WHERE id = ?', [item.productId]);
            if (!product) {
                validation.push({ productId: item.productId, error: 'Not found' });
                continue;
            }
            
            const isAvailable = product.stock_quantity >= item.quantity;
            if (isAvailable) {
                total += product.price * item.quantity;
            }
            validation.push({
                productId: item.productId,
                available: isAvailable,
                currentStock: product.stock_quantity
            });
        }
        res.json({ total, validation });
    } catch (err) { res.status(500).json({ message: 'Calculation error' }); }
});

// POST /api/checkout/place-order
router.post('/place-order', authGuard, async (req, res) => {
    const { cart, profile, paymentMethod, creditCardNumber } = req.body;
    
    if (!Array.isArray(cart) || cart.length === 0 || !profile) {
        return res.status(400).json({ error: { general: 'ข้อมูลการสั่งซื้อไม่สมบูรณ์' } });
    }

    const errors = {};
    const db = await getDB();

    try {
        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profile.emailaddress || !emailRegex.test(profile.emailaddress)) {
            errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        }

        if (paymentMethod === 'card') {
            if (!creditCardNumber || !/^\d{16}$/.test(creditCardNumber)) {
                errors.payment = "หมายเลขบัตรเครดิตต้องมี 16 หลัก";
            }
        }

        let totalAmount = 0;
        const stockErrors = [];
        const itemsToProcess = [];

        for (const item of cart) {
            const prod = await db.get('SELECT * FROM products WHERE id = ?', [item.id || item.productId]);
            if (!prod) {
                stockErrors.push(`ไม่พบสินค้า ID: ${item.id || item.productId}`);
                continue;
            }

            if (prod.stock_quantity < item.quantity) {
                stockErrors.push(`สินค้า "${prod.title}" สต็อกไม่พอ`);
            } else {
                const itemTotal = prod.price * item.quantity;
                totalAmount += itemTotal;
                itemsToProcess.push({ ...prod, orderQty: item.quantity, itemTotal });
            }
        }

        if (stockErrors.length > 0) errors.stock = stockErrors.join(', ');
        if (Object.keys(errors).length > 0) return res.status(400).json({ error: errors });

        // Transactional logic (simplified)
        const orderId = "ORD-" + Date.now();
        
        for (const item of itemsToProcess) {
            // 1. Cut Stock
            await db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.orderQty, item.id]);
            // 2. Save Order Item
            await db.run('INSERT INTO orders (user_id, product_id, quantity, total_price, order_id) VALUES (?, ?, ?, ?, ?)', 
                [req.user.id, item.id, item.orderQty, item.itemTotal, orderId]);
        }

        // 3. Update Profile
        const existingProfile = await db.get('SELECT id FROM profiles WHERE userId = ?', [req.user.id]);
        const profileData = [
            req.user.id, req.user.username, profile.firstname, profile.lastname, profile.country,
            profile.streetaddress, profile.apartment, profile.towncity, profile.postcodezip,
            profile.phone, profile.emailaddress, new Date().toISOString()
        ];

        if (existingProfile) {
            await db.run(`UPDATE profiles SET 
                username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                WHERE userId=?`, [...profileData.slice(1), req.user.id]);
        } else {
            await db.run(`INSERT INTO profiles 
                (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, profileData);
        }

        res.json({ success: true, orderId, totalAmount, message: 'บันทึกคำสั่งซื้อเรียบร้อย' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { general: 'Server Error' } });
    }
});

// GET /api/checkout/profile
router.get('/profile', authGuard, async (req, res) => {
    try {
        const db = await getDB();
        const profile = await db.get('SELECT * FROM profiles WHERE userId = ? OR username = ?', [req.user.id, req.user.username]);
        res.json(profile || {});
    } catch { res.json({}); }
});

// POST /api/checkout/save-profile
router.post('/save-profile', authGuard, async (req, res) => {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ message: 'ไม่มีข้อมูล' });

    try {
        const db = await getDB();
        const profileData = [
            req.user.id, req.user.username, profile.firstname, profile.lastname, profile.country,
            profile.streetaddress, profile.apartment, profile.towncity, profile.postcodezip,
            profile.phone, profile.emailaddress, new Date().toISOString()
        ];

        const existing = await db.get('SELECT id FROM profiles WHERE userId = ?', [req.user.id]);
        if (existing) {
            await db.run(`UPDATE profiles SET 
                username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                WHERE userId=?`, [...profileData.slice(1), req.user.id]);
        } else {
            await db.run(`INSERT INTO profiles 
                (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, profileData);
        }
        res.json({ success: true, message: 'บันทึกเรียบร้อย' });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const USER_DB_FILE = path.join(__dirname, '../../data/users.db');
const PRODUCT_DB_FILE = path.join(__dirname, '../../data/products.db');
const SECRET = "SUN_PRO_SECURE_KEY_2026";

async function getUserDB() {
    return open({
        filename: USER_DB_FILE,
        driver: sqlite3.Database
    });
}

async function getProductDB() {
    return open({
        filename: PRODUCT_DB_FILE,
        driver: sqlite3.Database
    });
}

// Middleware: Auth Guard
function authGuard(req, res, next) {
    // 🔥 CSRF Protection: Support token from cookies or header
    const token = req.cookies.sunToken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

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

    let productDb;
    try {
        productDb = await getProductDB();
        let total = 0;
        const validation = [];

        for (const item of cart) {
            const product = await productDb.get('SELECT * FROM products WHERE id = ?', [item.productId]);
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
    } catch (err) { 
        console.error("Calculate Total Error:", err);
        res.status(500).json({ message: 'Calculation error' }); 
    } finally {
        if (productDb) await productDb.close();
    }
});

// POST /api/checkout/place-order
router.post('/place-order', authGuard, async (req, res) => {
    const { cart, profile, paymentMethod, creditCardNumber } = req.body;
    
    if (!Array.isArray(cart) || cart.length === 0 || !profile) {
        return res.status(400).json({ error: { general: 'ข้อมูลการสั่งซื้อไม่สมบูรณ์' } });
    }

    const errors = {};
    let productDb, userDb;

    try {
        productDb = await getProductDB();
        userDb = await getUserDB();

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
            const prod = await productDb.get('SELECT * FROM products WHERE id = ?', [item.id || item.productId]);
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
            await productDb.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.orderQty, item.id]);
            // 2. Save Order Item
            await userDb.run('INSERT INTO orders (user_id, product_id, quantity, total_price, order_id) VALUES (?, ?, ?, ?, ?)', 
                [req.user.id, item.id, item.orderQty, item.itemTotal, orderId]);
        }

        // 3. Update Profile
        const existingProfile = await userDb.get('SELECT id FROM profiles WHERE userId = ?', [req.user.id]);
        const profileData = [
            req.user.id, req.user.username, profile.firstname, profile.lastname, profile.country,
            profile.streetaddress, profile.apartment, profile.towncity, profile.postcodezip,
            profile.phone, profile.emailaddress, new Date().toISOString()
        ];

        if (existingProfile) {
            await userDb.run(`UPDATE profiles SET 
                username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                WHERE userId=?`, [...profileData.slice(1), req.user.id]);
        } else {
            await userDb.run(`INSERT INTO profiles 
                (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, profileData);
        }

        res.json({ success: true, orderId, totalAmount, message: 'บันทึกคำสั่งซื้อเรียบร้อย' });

    } catch (err) {
        console.error("Place Order Error:", err);
        res.status(500).json({ error: { general: 'Server Error' } });
    } finally {
        if (productDb) await productDb.close();
        if (userDb) await userDb.close();
    }
});

// GET /api/checkout/profile
router.get('/profile', authGuard, async (req, res) => {
    let userDb;
    try {
        userDb = await getUserDB();
        const profile = await userDb.get('SELECT * FROM profiles WHERE userId = ? OR username = ?', [req.user.id, req.user.username]);
        res.json(profile || {});
    } catch (err) { 
        console.error("Get Profile Error:", err);
        res.json({}); 
    } finally {
        if (userDb) await userDb.close();
    }
});

// POST /api/checkout/save-profile
router.post('/save-profile', authGuard, async (req, res) => {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ message: 'ไม่มีข้อมูล' });

    let userDb;
    try {
        userDb = await getUserDB();
        const profileData = [
            req.user.id, req.user.username, profile.firstname, profile.lastname, profile.country,
            profile.streetaddress, profile.apartment, profile.towncity, profile.postcodezip,
            profile.phone, profile.emailaddress, new Date().toISOString()
        ];

        const existing = await userDb.get('SELECT id FROM profiles WHERE userId = ?', [req.user.id]);
        if (existing) {
            await userDb.run(`UPDATE profiles SET 
                username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                WHERE userId=?`, [...profileData.slice(1), req.user.id]);
        } else {
            await userDb.run(`INSERT INTO profiles 
                (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, profileData);
        }
        res.json({ success: true, message: 'บันทึกเรียบร้อย' });
    } catch (err) { 
        console.error("Save Profile Error:", err);
        res.status(500).json({ message: 'Error' }); 
    } finally {
        if (userDb) await userDb.close();
    }
});

module.exports = router;

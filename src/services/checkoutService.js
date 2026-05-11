const userRepository = require('../repositories/userRepository');
const productRepository = require('../repositories/productRepository');
const orderRepository = require('../repositories/orderRepository');
const { getProductDB } = require('../config/db');
const xss = require('xss');
const path = require('path');

const calculateTotal = async (cart) => {
    let total = 0;
    const validation = [];

    for (const item of cart) {
        // Fix Point 1: Negative Quantity Check
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            validation.push({ productId: item.productId, error: 'Invalid quantity' });
            continue;
        }

        const product = await productRepository.findById(item.productId);
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
    return { total, validation };
};

const placeOrder = async (userId, username, { cart, profile, expectedTotal }) => {
    const productDb = await getProductDB();
    const itemsToProcess = [];
    let totalAmount = 0;

    try {
        // 🔥 Phase 3: Cross-DB Transaction Support using ATTACH
        // We attach store.db and users.db to the products.db connection
        const storeDbPath = path.join(__dirname, '../../data/store.db');
        const usersDbPath = path.join(__dirname, '../../data/users.db');
        await productDb.run(`ATTACH DATABASE '${storeDbPath}' AS store_db`);
        await productDb.run(`ATTACH DATABASE '${usersDbPath}' AS users_db`);

        await productDb.run('BEGIN TRANSACTION');

        // 🔥 XSS Protection: Sanitize profile fields
        const sanitizedProfile = {};
        for (const key in profile) {
            if (typeof profile[key] === 'string') {
                sanitizedProfile[key] = xss(profile[key]);
            } else {
                sanitizedProfile[key] = profile[key];
            }
        }

        for (const item of cart) {
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                await productDb.run('ROLLBACK');
                return { error: "จำนวนสินค้าไม่ถูกต้อง" };
            }

            const prod = await productRepository.findById(item.id || item.productId, productDb);
            if (!prod || prod.stock_quantity < item.quantity) {
                await productDb.run('ROLLBACK');
                return { error: `สินค้า "${prod ? prod.title : 'Unknown'}" สต็อกไม่พอ` };
            }
            const itemTotal = prod.price * item.quantity;
            totalAmount += itemTotal;
            itemsToProcess.push({ ...prod, orderQty: item.quantity, itemTotal });
        }

        const orderId = "ORD-" + Date.now();
        
        // Phase 3: Price Inconsistency Check
        if (expectedTotal !== undefined && Math.abs(totalAmount - expectedTotal) > 0.01) {
            await productDb.run('ROLLBACK');
            return { error: "ราคาในตะกร้ามีการเปลี่ยนแปลง กรุณาตรวจสอบอีกครั้ง" };
        }

        for (const item of itemsToProcess) {
            await productRepository.updateStock(item.id, item.orderQty, productDb);
            
            // 🔥 Use the attached store_db
            await productDb.run(`
                INSERT INTO store_db.orders (user_id, product_id, quantity, total_price, order_id)
                VALUES (?, ?, ?, ?, ?)
            `, [userId, item.id, item.orderQty, item.itemTotal, orderId]);
        }

        // 🔥 Use the attached users_db for upsert
        const updatedAt = new Date().toISOString();
        const existing = await productDb.get('SELECT id FROM users_db.profiles WHERE userId = ?', [userId]);
        
        const params = [
            username, sanitizedProfile.firstname, sanitizedProfile.lastname, sanitizedProfile.country,
            sanitizedProfile.streetaddress, sanitizedProfile.apartment, sanitizedProfile.towncity,
            sanitizedProfile.postcodezip, sanitizedProfile.phone, sanitizedProfile.emailaddress, updatedAt
        ];

        if (existing) {
            await productDb.run(`UPDATE users_db.profiles SET 
                username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                WHERE userId=?`, [...params, userId]);
        } else {
            await productDb.run(`INSERT INTO users_db.profiles 
                (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [userId, ...params]);
        }

        await productDb.run('COMMIT');
        
        // Detach after commit
        await productDb.run('DETACH DATABASE store_db');
        await productDb.run('DETACH DATABASE users_db');
        
        return { success: true, orderId, totalAmount };

    } catch (error) {
        try { await productDb.run('ROLLBACK'); } catch(e) {}
        try { await productDb.run('DETACH DATABASE store_db'); } catch(e) {}
        try { await productDb.run('DETACH DATABASE users_db'); } catch(e) {}
        console.error("Place Order Error (Service):", error);
        throw error;
    } finally {
        await productDb.close();
    }
};

const getProfile = async (userId) => {
    const profile = await userRepository.getProfile(userId);
    return profile || {};
};

const saveProfile = async (userId, username, profile) => {
    // 🔥 XSS Protection: Sanitize profile fields
    const sanitizedProfile = {};
    for (const key in profile) {
        if (typeof profile[key] === 'string') {
            sanitizedProfile[key] = xss(profile[key]);
        } else {
            sanitizedProfile[key] = profile[key];
        }
    }
    await userRepository.upsertProfile(userId, username, sanitizedProfile);
    return { success: true };
};

module.exports = {
    calculateTotal,
    placeOrder,
    getProfile,
    saveProfile
};

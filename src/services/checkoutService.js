const userRepository = require('../repositories/userRepository');
const productRepository = require('../repositories/productRepository');
const { getProductDB } = require('../config/db');
const xss = require('xss');
const path = require('path');
const { nanoid } = require('nanoid');

const calculateTotal = async (cart) => {
    let total = 0; // Will be stored as integer (cents)
    const validation = [];

    for (const item of cart) {
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
            // 🔥 Phase 2, Item 7: Convert to integer (cents) for precision
            const priceInCents = Math.round(product.price * 100);
            total += priceInCents * item.quantity;
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
    let totalAmountCents = 0;

    try {
        const storeDbPath = path.join(__dirname, '../../data/store.db');
        const usersDbPath = path.join(__dirname, '../../data/users.db');
        await productDb.run(`ATTACH DATABASE '${storeDbPath}' AS store_db`);
        await productDb.run(`ATTACH DATABASE '${usersDbPath}' AS users_db`);

        await productDb.run('BEGIN TRANSACTION');

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
            // 🔥 Phase 2, Item 7: Convert to integer (cents) for precision
            const itemPriceCents = Math.round(prod.price * 100);
            const itemTotalCents = itemPriceCents * item.quantity;
            totalAmountCents += itemTotalCents;
            itemsToProcess.push({ ...prod, orderQty: item.quantity, itemTotalCents });
        }

        // 🔥 Phase 3, Item 9: Secure Unique Order ID
        const orderId = nanoid(12);
        
        // Phase 3: Price Inconsistency Check (using cents)
        if (expectedTotal !== undefined) {
            const expectedTotalCents = Math.round(expectedTotal * 100);
            if (totalAmountCents !== expectedTotalCents) {
                await productDb.run('ROLLBACK');
                return { error: "ราคาในตะกร้ามีการเปลี่ยนแปลง กรุณาตรวจสอบอีกครั้ง" };
            }
        }

        for (const item of itemsToProcess) {
            await productRepository.updateStock(item.id, item.orderQty, productDb);
            
            await productDb.run(`
                INSERT INTO store_db.orders (user_id, product_id, quantity, total_price, order_id)
                VALUES (?, ?, ?, ?, ?)
            `, [userId, item.id, item.orderQty, item.itemTotalCents, orderId]);
        }

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
        
        await productDb.run('DETACH DATABASE store_db');
        await productDb.run('DETACH DATABASE users_db');
        
        return { success: true, orderId, totalAmount: totalAmountCents / 100 };

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

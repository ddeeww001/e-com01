const { getStoreDB } = require('../config/db');

const OrderRepository = {
    async saveOrder(userId, productId, quantity, totalPrice, orderId, externalDb) {
        const db = externalDb || await getStoreDB();
        const sql = `
            INSERT INTO orders (user_id, product_id, quantity, total_price, order_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        return await db.run(sql, [userId, productId, quantity, totalPrice, orderId]);
    }
};

module.exports = OrderRepository;

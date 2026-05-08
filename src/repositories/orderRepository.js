const { getUserDB } = require('../config/db');

const OrderRepository = {
    async create(userId, productId, quantity, totalPrice, orderId) {
        const db = await getUserDB();
        try {
            return await db.run(
                'INSERT INTO orders (user_id, product_id, quantity, total_price, order_id) VALUES (?, ?, ?, ?, ?)',
                [userId, productId, quantity, totalPrice, orderId]
            );
        } finally {
            await db.close();
        }
    }
};

module.exports = OrderRepository;

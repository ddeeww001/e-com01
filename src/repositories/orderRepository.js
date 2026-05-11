const { getStoreDB } = require('../config/db');

const OrderRepository = {
    /**
     * Saves a new order to the store.db database.
     * @param {number} userId - The ID of the user placing the order.
     * @param {number} productId - The ID of the product being ordered.
     * @param {number} quantity - The quantity of the product.
     * @param {number} totalPrice - The total price of the order.
     * @returns {Promise<any>} The result of the insertion.
     */
    async saveOrder(userId, productId, quantity, totalPrice) {
        const db = await getStoreDB();
        try {
            // SQL INSERT statement as requested
            const sql = `
                INSERT INTO orders (user_id, product_id, quantity, total_price)
                VALUES (?, ?, ?, ?)
            `;
            const result = await db.run(sql, [userId, productId, quantity, totalPrice]);
            return result;
        } catch (error) {
            console.error("Database Error (Order Insertion):", error);
            throw error;
        } finally {
            await db.close();
        }
    }
};

module.exports = OrderRepository;

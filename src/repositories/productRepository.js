const { getProductDB } = require('../config/db');

const ProductRepository = {
    async findAll() {
        const db = await getProductDB();
        try {
            return await db.all('SELECT * FROM products');
        } finally {
            await db.close();
        }
    },

    async findById(id) {
        const db = await getProductDB();
        try {
            return await db.get('SELECT * FROM products WHERE id = ?', [id]);
        } finally {
            await db.close();
        }
    },

    async updateStock(id, quantity) {
        const db = await getProductDB();
        try {
            await db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, id]);
        } finally {
            await db.close();
        }
    }
};

module.exports = ProductRepository;

const { getProductDB } = require('../config/db');

const ProductRepository = {
    async findAll(externalDb) {
        const db = externalDb || await getProductDB();
        return await db.all('SELECT * FROM products');
    },

    async findById(id, externalDb) {
        const db = externalDb || await getProductDB();
        return await db.get('SELECT * FROM products WHERE id = ?', [id]);
    },

    async updateStock(id, quantity, externalDb) {
        const db = externalDb || await getProductDB();
        return await db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, id]);
    }
};

module.exports = ProductRepository;

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const PRODUCT_DB_FILE = path.join(__dirname, '../data/products.db');

const getAllProducts = async () => {
    const db = await open({
        filename: PRODUCT_DB_FILE,
        driver: sqlite3.Database
    });
    const products = await db.all('SELECT * FROM products');
    await db.close();
    return products;
};

module.exports = {
    getAllProducts
};

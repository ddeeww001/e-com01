const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Singleton connections
let productDb = null;
let userDb = null;
let storeDb = null;

async function getDB(filename) {
    const db = await open({
        filename: path.join(DATA_DIR, filename),
        driver: sqlite3.Database
    });
    
    // 🔥 Phase 2, Item 5: Enable WAL Mode for performance & concurrency
    await db.exec('PRAGMA journal_mode=WAL;');
    return db;
}

const dbConfig = {
    async getProductDB() {
        if (!productDb) {
            productDb = await getDB('products.db');
        }
        return productDb;
    },

    async getUserDB() {
        if (!userDb) {
            userDb = await getDB('users.db');
            // 🔥 Phase 1, Item 4: Add password_version for JWT revocation
            await userDb.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE,
                    password TEXT,
                    role TEXT,
                    password_version INTEGER DEFAULT 1,
                    createdAt DATETIME
                )
            `);
        }
        return userDb;
    },

    async getStoreDB() {
        if (!storeDb) {
            storeDb = await getDB('store.db');
            // Initialize table
            // 🔥 Phase 2, Item 7: Financial Precision - Change total_price to INTEGER (cents)
            await storeDb.exec(`
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    total_price INTEGER NOT NULL,
                    order_id TEXT UNIQUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        return storeDb;
    },

    // 🔥 Phase 3, Item 10: Helper to close all connections during shutdown
    async closeAll() {
        if (productDb) await productDb.close();
        if (userDb) await userDb.close();
        if (storeDb) await storeDb.close();
        console.log('✅ All database connections closed safely.');
    }
};

module.exports = dbConfig;

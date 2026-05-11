const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

/**
 * Connects to the store.db file and ensures the necessary tables exist.
 * @returns {Promise<Database>} The SQLite database connection object.
 */
async function getStoreDB() {
    const dbPath = path.join(__dirname, '../../data/store.db');
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Initialize the orders table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

module.exports = { getStoreDB };

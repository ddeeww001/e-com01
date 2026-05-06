const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'products.db');

async function migrate() {
    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    // 1. Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            category TEXT,
            description TEXT,
            imageUrl TEXT,
            price REAL,
            originalPrice REAL,
            stock_quantity INTEGER,
            badge TEXT,
            badgeClass TEXT
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            username TEXT,
            firstname TEXT,
            lastname TEXT,
            country TEXT,
            streetaddress TEXT,
            apartment TEXT,
            towncity TEXT,
            postcodezip TEXT,
            phone TEXT,
            emailaddress TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            total_price REAL,
            order_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Migrate Users
    try {
        const users = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'auth_user.json'), 'utf8'));
        for (const u of users) {
            await db.run('INSERT OR IGNORE INTO users (id, username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)', 
                [u.id, u.username, u.email, u.password, u.role, u.createdAt]);
        }
        console.log("Users migrated.");
    } catch (e) { console.log("Users migration skipped or failed", e.message); }

    // 3. Migrate Products
    try {
        const products = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'products.json'), 'utf8'));
        for (const p of products) {
            await db.run('INSERT OR IGNORE INTO products (id, title, category, description, imageUrl, price, originalPrice, stock_quantity, badge, badgeClass) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                [p.id, p.title, p.category, p.description, p.imageUrl, p.price, p.originalPrice, p.stock_quantity, p.badge, p.badgeClass]);
        }
        console.log("Products migrated.");
    } catch (e) { console.log("Products migration skipped or failed", e.message); }

    // 4. Migrate Profiles
    try {
        const profiles = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'user_profiles.json'), 'utf8'));
        for (const p of profiles) {
            await db.run('INSERT INTO profiles (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                [p.userId, p.username, p.firstname, p.lastname, p.country, p.streetaddress, p.apartment, p.towncity, p.postcodezip, p.phone, p.emailaddress]);
        }
        console.log("Profiles migrated.");
    } catch (e) { console.log("Profiles migration skipped or failed", e.message); }

    console.log("Migration complete!");
    await db.close();
}

migrate();

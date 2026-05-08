const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_DB = path.join(DATA_DIR, 'users.db');
const PRODUCTS_DB = path.join(DATA_DIR, 'products.db');

async function init() {
    console.log("🚀 Starting Database Initialization (20 Products)...");
    
    // 1. Initialize Products DB
    const pDb = await open({ filename: PRODUCTS_DB, driver: sqlite3.Database });
    await pDb.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            category TEXT,
            description TEXT,
            imageUrl TEXT,
            price REAL,
            originalPrice REAL,
            stock_quantity INTEGER DEFAULT 10,
            badge TEXT,
            badgeClass TEXT
        )
    `);

    const products = [
        { id: 1, title: 'Bacardi 151', category: 'Brandy', price: 49.00, originalPrice: 69.00, imageUrl: 'images/prod-1.jpg', badge: 'Sale', badgeClass: 'sale' },
        { id: 2, title: 'Jim Beam', category: 'Gin', price: 69.00, originalPrice: null, imageUrl: 'images/prod-2.jpg', badge: 'Best Seller', badgeClass: 'seller' },
        { id: 3, title: 'Citadelle', category: 'Rum', price: 69.00, originalPrice: null, imageUrl: 'images/prod-3.jpg', badge: 'New Arrival', badgeClass: 'new' },
        { id: 4, title: 'The Glenlivet', category: 'Rum', price: 69.00, originalPrice: null, imageUrl: 'images/prod-4.jpg', badge: null, badgeClass: null },
        { id: 5, title: 'Black Label', category: 'Whiskey', price: 69.00, originalPrice: null, imageUrl: 'images/prod-5.jpg', badge: null, badgeClass: null },
        { id: 6, title: 'Macallan', category: 'Tequila', price: 69.00, originalPrice: null, imageUrl: 'images/prod-6.jpg', badge: null, badgeClass: null },
        { id: 7, title: 'Old Monk', category: 'Vodka', price: 69.00, originalPrice: null, imageUrl: 'images/prod-7.jpg', badge: null, badgeClass: null },
        { id: 8, title: 'Jameson Irish', category: 'Whiskey', price: 69.00, originalPrice: null, imageUrl: 'images/prod-8.jpg', badge: null, badgeClass: null },
        { id: 9, title: 'Screwball Peanut', category: 'Whiskey', price: 55.00, originalPrice: null, imageUrl: 'images/prod-9.jpg', badge: null, badgeClass: null },
        { id: 10, title: 'Mcclellands', category: 'Whiskey', price: 45.00, originalPrice: null, imageUrl: 'images/prod-10.jpg', badge: null, badgeClass: null },
        { id: 11, title: 'Plantation Rum', category: 'Rum', price: 39.00, originalPrice: 50.00, imageUrl: 'images/prod-11.jpg', badge: 'Sale', badgeClass: 'sale' },
        { id: 12, title: 'Grey Goose', category: 'Vodka', price: 89.00, originalPrice: null, imageUrl: 'images/prod-12.jpg', badge: 'Premium', badgeClass: 'seller' },
        { id: 13, title: 'Hennessy VS', category: 'Brandy', price: 120.00, originalPrice: null, imageUrl: 'images/prod-1.jpg', badge: null, badgeClass: null },
        { id: 14, title: 'Bombay Sapphire', category: 'Gin', price: 75.00, originalPrice: null, imageUrl: 'images/prod-2.jpg', badge: 'Popular', badgeClass: 'new' },
        { id: 15, title: 'Captain Morgan', category: 'Rum', price: 35.00, originalPrice: null, imageUrl: 'images/prod-3.jpg', badge: null, badgeClass: null },
        { id: 16, title: 'Patron Silver', category: 'Tequila', price: 150.00, originalPrice: null, imageUrl: 'images/prod-6.jpg', badge: 'Luxury', badgeClass: 'seller' },
        { id: 17, title: 'Absolut Vodka', category: 'Vodka', price: 40.00, originalPrice: null, imageUrl: 'images/prod-7.jpg', badge: null, badgeClass: null },
        { id: 18, title: 'Jack Daniels', category: 'Whiskey', price: 65.00, originalPrice: null, imageUrl: 'images/prod-5.jpg', badge: null, badgeClass: null },
        { id: 19, title: 'Malibu Rum', category: 'Rum', price: 30.00, originalPrice: null, imageUrl: 'images/prod-11.jpg', badge: null, badgeClass: null },
        { id: 20, title: 'Jose Cuervo', category: 'Tequila', price: 50.00, originalPrice: 60.00, imageUrl: 'images/prod-6.jpg', badge: 'Sale', badgeClass: 'sale' }
    ];

    for (const p of products) {
        await pDb.run(`INSERT OR REPLACE INTO products (id, title, category, description, imageUrl, price, originalPrice, stock_quantity, badge, badgeClass) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                       [p.id, p.title, p.category, '', p.imageUrl, p.price, p.originalPrice, 10, p.badge, p.badgeClass]);
    }
    await pDb.close();

    // 2. Initialize Users DB
    const uDb = await open({ filename: USERS_DB, driver: sqlite3.Database });
    await uDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user',
            createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER UNIQUE,
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
            updatedAt TEXT,
            FOREIGN KEY(userId) REFERENCES users(id)
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
    await uDb.close();
    console.log("✅ Databases initialized with 20 items successfully!");
}

init().catch(err => console.error(err));

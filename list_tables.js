const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function list() {
    try {
        const db = await open({ filename: 'data/products.db', driver: sqlite3.Database });
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables in products.db:", tables);
        for (const table of tables) {
            const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`Table ${table.name} has ${count.count} rows`);
        }
        await db.close();
    } catch (err) {
        console.error(err);
    }
}
list();

// ไฟล์: src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// ฟังก์ชันเชื่อมต่อ Database
async function getDB() {
    return open({ filename: './database.sqlite', driver: sqlite3.Database });
}

// API: ดึงรายการสินค้าทั้งหมด
router.get('/', async (req, res) => {
    try {
        const db = await getDB();
        // ค้นหาสินค้าทั้งหมดจากตาราง products
        const products = await db.all('SELECT * FROM products');
        res.status(200).json(products);
    } catch (err) {
        console.error("Fetch Products Error:", err);
        res.status(500).json({ message: "ระบบขัดข้อง ไม่สามารถดึงข้อมูลสินค้าได้" });
    }
});

module.exports = router;
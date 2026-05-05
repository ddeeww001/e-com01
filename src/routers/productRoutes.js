// ไฟล์: src/Express/productRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// กำหนด Path ให้อ้างอิงไปที่โฟลเดอร์ data เพื่อใช้ไฟล์ products.json
// (ถอยหลัง 2 ชั้น ../../ เพื่อออกจากโฟลเดอร์ src/Express ไปที่ root แล้วเข้าโฟลเดอร์ data)
const PRODUCTS_FILE_PATH = path.join(__dirname, '../../data/products.json');

// API: ดึงรายการสินค้าทั้งหมด
router.get('/', async (req, res) => {
    try {
        // อ่านข้อมูลจากไฟล์ JSON แทนการ Query SQLite
        const data = await fs.readFile(PRODUCTS_FILE_PATH, 'utf8');
        const products = JSON.parse(data);
        
        // ส่งข้อมูล Array ของสินค้ากลับไปให้หน้าบ้าน (ได้ผลลัพธ์เหมือน SQLite เป๊ะ)
        res.status(200).json(products);
    } catch (err) {
        console.error("Fetch Products Error:", err);
        // หากหาไฟล์ไม่เจอ หรือระบบขัดข้อง ให้ส่ง 500 กลับไป
        res.status(500).json({ message: "ระบบขัดข้อง ไม่สามารถดึงข้อมูลสินค้าได้" });
    }
});

// อย่าลืม export router ออกไปให้ server.js ใช้งานด้วยนะครับ
module.exports = router;
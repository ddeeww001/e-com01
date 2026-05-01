const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// เมื่อมี GET Request เข้ามาที่ Root ของ Route นี้ ให้เรียกใช้ Controller
// (เดี๋ยวเราจะเอาไปผูกกับ /api/products ใน server.js)
router.get('/', productController.getProducts);

module.exports = router;
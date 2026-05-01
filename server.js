const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. นำเข้า path module
const app = express();
const PORT = 3000;

const productRoutes = require('./src/routes/productRoutes');

app.use(cors());
app.use(express.json());

// API สำหรับจัดการข้อมูลสินค้า Fresh Market
app.use('/api/products', productRoutes);

// 2. ลบ app.get('/') อันเก่าออก แล้วใส่คำสั่งนี้แทน
// คำสั่งนี้จะเสิร์ฟไฟล์ HTML, CSS, JS และรูปภาพทั้งหมดที่อยู่ในโฟลเดอร์เดียวกับ server.js
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Backend Server รันอยู่บนพอร์ต http://localhost:${PORT}`);
});
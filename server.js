const express = require('express');
const cors = require('cors'); // นำเข้า CORS
const app = express();
const PORT = 3000;

// นำเข้า Routes ที่เราเพิ่งสร้าง
const productRoutes = require('./src/routes/productRoutes');

// อนุญาตให้ Frontend (Port 3833) ดึงข้อมูลจาก Backend นี้ได้
app.use(cors());

// แปลง Request ที่เข้ามาให้อยู่ในรูปแบบ JSON
app.use(express.json());

// ใช้งาน Route: ทุก Request ที่ขึ้นต้นด้วย /api/products จะถูกโยนไปให้ productRoutes จัดการ
app.use('/api/products', productRoutes);

// สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
    console.log(`Backend Server รันอยู่บนพอร์ต http://localhost:${PORT}`);
});
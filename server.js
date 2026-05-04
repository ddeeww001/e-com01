const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// ==========================================
// ฟังก์ชันเตรียมความพร้อมไฟล์ JSON (เผื่อไฟล์หาย)
// ==========================================
const dataDir = path.join(__dirname, 'data');
const authFile = path.join(dataDir, 'auth_user.json');

(async () => {
    await fs.mkdir(dataDir, { recursive: true }).catch(() => {}); 
    try {
        await fs.access(authFile);
        console.log("✅ ไฟล์ auth_user.json พร้อมใช้งาน");
    } catch (err) {
        await fs.writeFile(authFile, JSON.stringify([], null, 2));
        console.log("⚠️ สร้างไฟล์ auth_user.json ใหม่เรียบร้อย");
    }
})();

// ==========================================
// 🌟 Import Router ที่เราแยกไฟล์ไว้มาใช้งาน
// ==========================================
const authRoutes = require('./src/routers/register');

// ใช้งาน Router โดยนำไปต่อที่ endpoint /api
// (จะทำให้ได้ endpoint เป็น /api/signup และ /api/login เหมือนเดิมเป๊ะ)
app.use('/api', authRoutes);

app.listen(3000, () => console.log('🚀 Server is running on port 3000'));
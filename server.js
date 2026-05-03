const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET = "SUN_PRO_SECURE_KEY_2026"; 

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// 1. เชื่อมต่อ SQLite และสร้างตาราง
// ==========================================
// ==========================================
// 1. เชื่อมต่อ SQLite และสร้างตาราง
// ==========================================
let db;
(async () => {
    db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
    
    // 🌟 สั่งลบตารางเก่าทิ้งไปเลย (แก้ปัญหาตารางค้าง)
    await db.exec(`DROP TABLE IF EXISTS users`);
    
    // สร้างใหม่ให้มีช่อง email 
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE, 
            password TEXT,
            role TEXT DEFAULT 'customer'
        )
    `);
    console.log("🗄️ SQLite Connected & Tables Ready.");
})();

// ==========================================
// 2. API: Sign Up (บันทึกลง SQLite + users.json)
// ==========================================
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });

    try {
        const existingEmail = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingEmail) return res.status(409).json({ errorType: "EMAIL_EXISTS", message: "อีเมลนี้มีผู้ใช้งานแล้ว กรุณาเข้าสู่ระบบ" });

        const existingUsername = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsername) return res.status(409).json({ errorType: "USERNAME_TAKEN", message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาตั้งชื่อใหม่" });

        const hash = await bcrypt.hash(password, 10);
        const result = await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash]);

        // --- ระบบเขียนไฟล์ JSON สำรอง ---
        const dataDir = path.join(__dirname, 'data');
        const usersFilePath = path.join(dataDir, 'users.json');
        
        // ถ้าไม่มีโฟลเดอร์ data ให้สร้างขึ้นมาอัตโนมัติ (แก้ปัญหา Error 500 จุดที่ 1)
        try { await fs.mkdir(dataDir, { recursive: true }); } catch (err) {}

        let usersJson = [];
        try {
            const fileData = await fs.readFile(usersFilePath, 'utf8');
            if (fileData) usersJson = JSON.parse(fileData);
        } catch (err) { }

        usersJson.push({
            id: result.lastID,
            username: username,
            email: email,
            password: hash,
            role: 'customer',
            createdAt: new Date().toISOString()
        });

        await fs.writeFile(usersFilePath, JSON.stringify(usersJson, null, 2), 'utf8');
        // --------------------------------

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ" });
    } catch (err) {
        console.error("Signup Error (ดูตรงนี้ว่าพังเพราะอะไร):", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
});

// ==========================================
// 3. API: Sign In (รับชื่อ หรือ อีเมล ก็ได้)
// ==========================================
app.post('/api/signin', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        
        const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' });
        res.json({ message: "เข้าสู่ระบบสำเร็จ", token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error("Signin Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// เสิร์ฟ Routes อื่นๆ (ถ้ามี)
 app.use('/api/products', require('./src/routes/productRoutes'));

app.listen(PORT, () => {
    console.log(`🚀 Backend Server กำลังรันที่ http://localhost:${PORT}`);
});
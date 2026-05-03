const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const SECRET = "SUN_PRO_SECURE_KEY_2026"; // กุญแจลับสำหรับ Token

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db;
(async () => {
    db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
    
    // 1. ตารางเก็บข้อมูลลูกค้า (มีอยู่แล้ว)
    await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'customer')`);
    
    // 2. ตารางเก็บข้อมูลสินค้า (เพิ่มใหม่)
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE, -- เพิ่มฟิลด์ email
        password TEXT,
        role TEXT DEFAULT 'customer'
    )
`);
    
    console.log("🗄️ SQLite Connected & Tables Ready.");
})();

// 2. API: สมัครสมาชิก (เร็วขึ้น! ทำงาน DB แค่ 1 รอบ ไม่ต้องเช็คซ้ำ)
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body; // รับ email เพิ่ม
    if (!username || !email || !password) return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });

    try {
        const hash = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash]);
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) {
        res.status(400).json({ message: "ชื่อผู้ใช้หรืออีเมลนี้มีในระบบแล้ว" });
    }
});

// 3. API: เข้าสู่ระบบ (ยุบรวมเงื่อนไขให้สั้นลง)
app.post('/api/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง" });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' });
        res.json({ message: "เข้าสู่ระบบสำเร็จ", token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// เสิร์ฟ Routes อื่นๆ
app.use('/api/products', require('./src/routes/productRoutes'));

app.listen(3000, () => console.log(`🚀 Server running on http://localhost:3000`));
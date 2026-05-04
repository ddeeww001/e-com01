const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

const SECRET = "SUN_PRO_SECURE_KEY_2026";
let db;

(async () => {
    db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
    await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'customer')`);
    
    // 🌟 ดึงข้อมูลจากไฟล์ JSON ของคุณมาใส่ SQLite อัตโนมัติ
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true }).catch(() => {}); 
    
    try {
        const usersData = await fs.readFile(path.join(dataDir, 'users.json'), 'utf8');
        const jsonUsers = JSON.parse(usersData);
        
        for (let u of jsonUsers) {
            const exists = await db.get('SELECT * FROM users WHERE username = ?', [u.username]);
            if (!exists) {
                // เข้ารหัสรหัสผ่านจาก JSON ก่อนบันทึก เพื่อให้ Sign In ทำงานได้
                const hash = await bcrypt.hash(u.password, 10);
                const email = u.email || `${u.username}@example.com`; // ดักจับกรณีใน JSON ไม่มีฟิลด์ email
                await db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [u.username, email, hash, u.role || 'customer']);
            }
        }
        console.log("✅ ซิงค์ข้อมูลจาก users.json ลง SQLite สำเร็จ");
    } catch (err) {
        // กรณีไม่มีไฟล์ JSON
    }
    
    console.log("🗄️ SQLite & Folders Ready.");
})();

app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });

    try {
        const userExists = await db.get('SELECT email, username FROM users WHERE email = ? OR username = ?', [email, username]);
        if (userExists) {
            const isEmail = userExists.email === email;
            return res.status(409).json({ 
                errorType: isEmail ? "EMAIL_EXISTS" : "USERNAME_TAKEN", 
                message: isEmail ? "อีเมลนี้มีผู้ใช้งานแล้ว" : "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" 
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const { lastID } = await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash]);

        // Backup ลง JSON
        const fp = path.join(__dirname, 'data', 'users.json');
        let users = [];
        try { users = JSON.parse(await fs.readFile(fp, 'utf8')); } catch (e) {}
        users.push({ id: lastID, username, email, password: hash, role: 'customer', createdAt: new Date().toISOString() });
        await fs.writeFile(fp, JSON.stringify(users, null, 2));

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
});

// ==========================================
// POST /api/login (Security Engineer Standard)
// ==========================================
app.post('/api/login', async (req, res) => {
    // It should receive an email and a password.
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        // Check if the email is not in my database, return 401 Unauthorized status.
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // If it exists, use a library like bcrypt to compare the submitted password with a hashed one
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            // Return 401 Unauthorized status if password doesn't match
            return res.status(401).json({ message: "Unauthorized" });
        }

        // If it matches, use jsonwebtoken to sign a token containing the user's ID.
        const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '24h' });

        // Return the token with a 200 status.
        // (แนบข้อมูล user กลับไปนิดหน่อย เพื่อให้ authService.js หน้าบ้านเอาไปแสดงชื่อโปรไฟล์ได้)
        return res.status(200).json({ 
            token: token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("Login Route Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// app.use('/api/products', require('./src/routes/productRoutes'));
app.listen(3000, () => console.log('🚀 Server is running on port 3000'));
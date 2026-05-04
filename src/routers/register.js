const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// 🌟 แก้ไข Path ให้ถอยหลัง 2 ชั้น เพื่อให้อ้างอิงไปที่โฟลเดอร์ data ของโปรเจกต์หลัก
const DB_PATH = path.join(__dirname, '../../data/auth_user.json');
const SECRET = "SUN_PRO_SECURE_KEY_2026";

// ==========================================
// POST /signup (แก้ชื่อ Endpoint และพารามิเตอร์ให้ตรงกับหน้าบ้าน ไม่ให้ระบบพัง)
// ==========================================
router.post('/signup', async (req, res) => {
    // หน้าบ้านส่ง username, email, password มา
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    try {
        let users = [];
        try {
            const data = await fs.readFile(DB_PATH, 'utf8');
            users = JSON.parse(data);
        } catch (err) {
            users = []; 
        }

        // เช็คว่ามีอีเมลหรือชื่อผู้ใช้นี้หรือยัง
        const userExists = users.find(u => u.email === email || u.username === username);
        if (userExists) {
            const isEmail = userExists.email === email;
            return res.status(409).json({ 
                errorType: isEmail ? "EMAIL_EXISTS" : "USERNAME_TAKEN", 
                message: isEmail ? "อีเมลนี้มีผู้ใช้งานแล้ว" : "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" 
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        
        const newUser = { 
            id: newId, 
            username, 
            email, 
            password: hash, 
            role: 'customer', 
            createdAt: new Date().toISOString() 
        };

        users.push(newUser);
        await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Server Error" }); 
    }
});

// ==========================================
// POST /login (ย้ายระบบ Login จาก server.js มารวมไว้ที่นี่)
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        let users = [];
        try {
            const data = await fs.readFile(DB_PATH, 'utf8');
            users = JSON.parse(data);
        } catch (err) {
            return res.status(500).json({ message: "Database Error" });
        }

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '24h' });

        return res.status(200).json({ 
            token: token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("Login Route Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
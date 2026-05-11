const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const USER_DB_FILE = path.join(__dirname, '../../data/users.db');
const PRODUCT_DB_FILE = path.join(__dirname, '../../data/products.db');
const SECRET = "SUN_PRO_SECURE_KEY_2026";

async function getUserDB() {
    return open({
        filename: USER_DB_FILE,
        driver: sqlite3.Database
    });
}

async function getProductDB() {
    return open({
        filename: PRODUCT_DB_FILE,
        driver: sqlite3.Database
    });
}

// ==========================================
// POST /signup (Use users table in DB)
// ==========================================
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    try {
        const db = await getUserDB();
        const userExists = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        
        if (userExists) {
            const isEmail = userExists.email === email;
            return res.status(409).json({ 
                errorType: isEmail ? "EMAIL_EXISTS" : "USERNAME_TAKEN", 
                message: isEmail ? "อีเมลนี้มีผู้ใช้งานแล้ว" : "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" 
            });
        }

        const hash = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)', 
            [username, email, hash, 'customer', new Date().toISOString()]);

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Server Error" }); 
    }
});

// ==========================================
// POST /login (Use users table in DB)
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        const db = await getUserDB();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' });

        // 🔥 CSRF Protection: Set JWT in HttpOnly Cookie
        res.cookie('sunToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(200).json({ 
            token: token, // Keep in body for now to avoid breaking frontend immediately
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("Login Route Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
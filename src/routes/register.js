const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

// กำหนด Path ไปยังไฟล์ auth_user.json ตามที่โจทย์สั่ง
const DB_PATH = path.join(__dirname, '../data/auth_user.json');

// POST Route for user registration
router.post('/register', async (req, res) => {
    // 1. รับค่า Name, Username (ใช้ Email) และ Password
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ message: "Please provide all required fields." });
    }

    try {
        // 2. อ่านข้อมูลจาก auth_user.json
        let users = [];
        try {
            const data = await fs.readFile(DB_PATH, 'utf8');
            users = JSON.parse(data);
        } catch (err) {
            // ถ้าไฟล์ไม่มีอยู่ ให้เริ่มด้วย Array ว่าง
            users = []; 
        }

        // 3. Check for existing username on the backend using auth_user.json
        const userExists = users.find(u => u.username === username);
        if (userExists) {
            return res.status(409).json({ message: "Username (Email) already exists!" });
        }

        // 4. เข้ารหัสรหัสผ่าน (Hash Password)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Store new register uses in auth_user.json
        const newUser = {
            id: Date.now(), // สร้าง ID จำลองจากเวลา
            name: name,
            username: username, // ใช้ Email เป็น Username
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        
        // บันทึกกลับลงไปในไฟล์ JSON
        await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));

        // ส่ง Response กลับว่าสำเร็จ
        res.status(201).json({ message: "User registered successfully!" });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
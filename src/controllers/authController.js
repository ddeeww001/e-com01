const authService = require('../services/authService');

const signup = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    try {
        const result = await authService.signup({ username, email, password });
        if (result.error) {
            return res.status(409).json({ 
                errorType: result.error, 
                message: result.error === "EMAIL_EXISTS" ? "อีเมลนี้มีผู้ใช้งานแล้ว" : "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" 
            });
        }
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        const result = await authService.login({ email, password });
        if (!result) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        res.status(200).json(result);
    } catch (err) {
        console.error("Login Controller Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    signup,
    login
};

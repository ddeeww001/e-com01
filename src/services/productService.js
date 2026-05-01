const fs = require('fs').promises;
const path = require('path');

// ฟังก์ชันสำหรับอ่านไฟล์ JSON
const getAllProducts = async () => {
    // กำหนดเส้นทางย้อนกลับไปหาโฟลเดอร์ data
    const filePath = path.join(__dirname, '../../data/products.json');
    
    // อ่านไฟล์แบบ Asynchronous
    const rawData = await fs.readFile(filePath, 'utf8');
    
    // แปลงข้อความ JSON ให้เป็น JavaScript Object
    return JSON.parse(rawData);
};

module.exports = {
    getAllProducts
};
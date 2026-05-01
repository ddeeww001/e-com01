const productService = require('../services/productService');

const getProducts = async (req, res) => {
    try {
        // สั่งให้ Service ไปเอาข้อมูลมาให้
        const products = await productService.getAllProducts();
        
        // ส่งข้อมูลกลับไปให้ Frontend พร้อม Status 200 (OK)
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        // กรณีอ่านไฟล์ไม่สำเร็จ ส่ง Status 500 (Internal Server Error)
        res.status(500).json({ message: "ไม่สามารถดึงข้อมูลสินค้าได้", error: error.message });
    }
};

module.exports = {
    getProducts
};
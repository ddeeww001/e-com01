const productService = require('../services/productService');

const getProducts = async (req, res) => {
    try {
        // [Gatekeeper] ตรวจสอบว่าหน้าบ้านส่งหมวดหมู่มาไหม
        const categoryFilter = req.query.category;
        
        // ดึงสินค้าทั้งหมด (ในขั้นถัดไปเราจะไปดึงจาก SQLite)
        let products = await productService.getAllProducts();
        
        if (categoryFilter && categoryFilter.toLowerCase() !== 'all') {
            products = products.filter(p => 
                p.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }
        
        res.status(200).json(products);
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
};

module.exports = { getProducts };
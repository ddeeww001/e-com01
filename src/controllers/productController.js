const productService = require('../services/productService');

const getProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
};

module.exports = { 
    getProducts 
};

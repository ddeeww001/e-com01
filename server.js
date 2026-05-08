const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// ==========================================
// 🌟 Import Router ที่เราแยกไฟล์ไว้มาใช้งาน
// ==========================================
const authRoutes = require('./src/routers/Express');
const checkoutRoutes = require('./src/routers/checkout');
const productRoutes = require('./src/routers/productRoutes');

// ใช้งาน Router โดยนำไปต่อที่ endpoint /api
app.use('/api', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/products', productRoutes);

app.listen(3000, () => console.log('🚀 Server is running on port 3000'));
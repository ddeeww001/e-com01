require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dbConfig = require('./src/config/db');

const app = express();

// 🔥 Phase 2, Item 2: Rate Limiting (DoS Protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// 🔥 Phase 1, Item 3: Security Headers (Configured for CDN & Inline Scripts)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "code.jquery.com", "stackpath.bootstrapcdn.com"],
            "script-src-attr": ["'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"],
            "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "stackpath.bootstrapcdn.com"],
            "font-src": ["'self'", "fonts.gstatic.com", "stackpath.bootstrapcdn.com"],
        },
    },
}));

// 🔥 Phase 2, Item 7: Performance Compression
app.use(compression());

// 🔥 Phase 1, Item 1: CSRF Protection Support
app.use(cookieParser());

app.use(cors({
    origin: true, // In production, replace with your frontend URL
    credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(express.static(__dirname)); 

// ==========================================
// 🔐 JWT Security Configuration (RFC 7519)
// ==========================================
// 🔥 Phase 3: Fail-Fast - Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
    console.error("❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables!");
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
app.set('jwt_secret', JWT_SECRET);

// ==========================================
// 🌟 Import Routers
// ==========================================
const authRoutes = require('./src/routers/Express');
const checkoutRoutes = require('./src/routers/checkout');
const productRoutes = require('./src/routers/productRoutes');

app.use('/api', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/products', productRoutes);

// 🔥 Phase 3, Item 8: Global Error Handler Middleware with PII Masking
app.use((err, req, res, next) => {
    // Mask sensitive PII data before logging
    const maskedBody = { ...req.body };
    const piiFields = ['email', 'phone', 'address', 'password', 'creditCardNumber', 'emailaddress'];
    piiFields.forEach(field => {
        if (maskedBody[field]) maskedBody[field] = '***MASKED***';
        if (maskedBody.profile && maskedBody.profile[field]) maskedBody.profile[field] = '***MASKED***';
    });

    console.error(`[Error] ${err.message}`, { path: req.path, body: maskedBody });

    // Hide stack trace in production
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        message: isProduction ? 'Internal Server Error' : err.message,
        error: isProduction ? {} : err
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));

// 🔥 Phase 3, Item 10: Graceful Shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutdown signal received. Closing server and DB...');
    server.close(async () => {
        await dbConfig.closeAll();
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

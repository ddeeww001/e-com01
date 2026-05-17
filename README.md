# 🍷 LiquorStore Full-Stack E-Commerce

A secure, high-performance, and production-ready e-commerce platform built with Node.js, Express, and SQLite.

## 🏗️ Architecture: Layered Design Pattern

This project is built using a **Layered Architecture (Controller-Service-Repository)** to ensure high maintainability, scalability, and clear separation of concerns.

- **Controllers:** Manage HTTP requests and responses, using `express-async-handler` for clean, centralized error flow.
- **Services:** Execute core business logic, such as inventory validation, price consistency checks, and multi-database atomic transactions.
- **Repositories:** Handle raw data interactions using optimized and parameterized SQL queries.
- **Config:** Manages database connection singletons and environment-specific settings.

## 🛡️ Security Features (Enterprise-Hardened)

- **Authentication:** JWT-based authentication delivered via **HttpOnly, SameSite=Strict Cookies** to mitigate CSRF and XSS-based token theft.
- **Fail-Fast Security:** The application enforces a strict security policy, refusing to start if essential environment variables (like `JWT_SECRET`) are missing.
- **Data Integrity:** Implements atomic operations across multiple SQLite files (`products.db`, `store.db`, `users.db`) using the `ATTACH DATABASE` command within a single transaction.
- **Input Protection:**
  - **XSS Sanitization:** All user-submitted profile data is sanitized through the `xss` library before database persistence.
  - **SQL Injection Prevention:** 100% protection ensured by using parameterized queries throughout the repository layer.
- **DDoS Prevention:** Integrated `express-rate-limit` to throttle high-frequency API requests and prevent resource exhaustion.
- **Security Headers:** Configured `helmet.js` with a custom Content Security Policy (CSP) to allow trusted CDNs while blocking malicious inline scripts.

## 🚀 Performance Optimizations

- **SQLite WAL Mode:** Enabled Write-Ahead Logging to support high-concurrency read/write operations without database locking.
- **Database Connection Singletons:** Optimized performance and reduced Disk I/O by implementing a singleton pattern for database connections.
- **Gzip Compression:** Utilizes the `compression` middleware to reduce payload size, significantly improving load times for end-users.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (Architected with separate storage files for Users, Products, and Orders)
- **Security:** JWT, Bcrypt, Helmet, XSS-filters, Cookie-parser, Express-rate-limit
- **Frontend:** Vanilla JavaScript, HTML5, CSS3, Bootstrap

## 📥 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=3000
JWT_SECRET=your_super_secret_key_here (See .env.example)
NODE_ENV=development
```

### 3. Running the Server

```bash
npm run dev
```

## 👨‍💻 Engineering Highlights

- **Consolidated Database Management:** The `src/config/db.js` provides a centralized singleton for `products.db`, `users.db`, and the newly added `store.db`, ensuring optimal connection pooling.
- **Order Repository Pattern:** Orders are persisted using a dedicated `OrderRepository` with a clean `saveOrder` implementation, consolidating `user_id`, `product_id`, `quantity`, and `total_price` into the persistent `store.db`.
- **Atomic Multi-DB Checkout:** Check `src/services/checkoutService.js` to see the implementation of cross-database transactions using SQLite's `ATTACH` feature.
- **Sensitive Data Masking:** Review `server.js` for the global error handler that masks PII (Personally Identifiable Information) in system logs.

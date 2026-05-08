const { getUserDB } = require('../config/db');

const UserRepository = {
    async findByEmail(email) {
        const db = await getUserDB();
        try {
            return await db.get('SELECT * FROM users WHERE email = ?', [email]);
        } finally {
            await db.close();
        }
    },

    async findByUsername(username) {
        const db = await getUserDB();
        try {
            return await db.get('SELECT * FROM users WHERE username = ?', [username]);
        } finally {
            await db.close();
        }
    },

    async create(username, email, hashedPassword) {
        const db = await getUserDB();
        try {
            return await db.run(
                'INSERT INTO users (username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)',
                [username, email, hashedPassword, 'customer', new Date().toISOString()]
            );
        } finally {
            await db.close();
        }
    },

    async getProfile(userId) {
        const db = await getUserDB();
        try {
            return await db.get('SELECT * FROM profiles WHERE userId = ?', [userId]);
        } finally {
            await db.close();
        }
    },

    async upsertProfile(userId, username, profileData) {
        const db = await getUserDB();
        try {
            const updatedAt = new Date().toISOString();
            const existing = await db.get('SELECT id FROM profiles WHERE userId = ?', [userId]);
            
            const params = [
                username, profileData.firstname, profileData.lastname, profileData.country,
                profileData.streetaddress, profileData.apartment, profileData.towncity,
                profileData.postcodezip, profileData.phone, profileData.emailaddress, updatedAt
            ];

            if (existing) {
                await db.run(`UPDATE profiles SET 
                    username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                    apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                    WHERE userId=?`, [...params, userId]);
            } else {
                await db.run(`INSERT INTO profiles 
                    (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [userId, ...params]);
            }
        } finally {
            await db.close();
        }
    }
};

module.exports = UserRepository;

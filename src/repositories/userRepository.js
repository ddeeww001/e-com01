const { getUserDB } = require('../config/db');

const UserRepository = {
    async findByEmail(email) {
        const db = await getUserDB();
        return await db.get('SELECT * FROM users WHERE email = ?', [email]);
    },

    async findByUsername(username) {
        const db = await getUserDB();
        return await db.get('SELECT * FROM users WHERE username = ?', [username]);
    },

    async create(username, email, hashedPassword) {
        const db = await getUserDB();
        return await db.run(
            'INSERT INTO users (username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 'customer', new Date().toISOString()]
        );
    },

    async getProfile(userId) {
        const db = await getUserDB();
        return await db.get('SELECT * FROM profiles WHERE userId = ?', [userId]);
    },

    async upsertProfile(userId, username, profileData, externalDb) {
        const db = externalDb || await getUserDB();
        const updatedAt = new Date().toISOString();
        const existing = await db.get('SELECT id FROM profiles WHERE userId = ?', [userId]);
        
        const params = [
            username, profileData.firstname, profileData.lastname, profileData.country,
            profileData.streetaddress, profileData.apartment, profileData.towncity,
            profileData.postcodezip, profileData.phone, profileData.emailaddress, updatedAt
        ];

        if (existing) {
            return await db.run(`UPDATE profiles SET 
                username=?, firstname=?, lastname=?, country=?, streetaddress=?, 
                apartment=?, towncity=?, postcodezip=?, phone=?, emailaddress=?, updatedAt=? 
                WHERE userId=?`, [...params, userId]);
        } else {
            return await db.run(`INSERT INTO profiles 
                (userId, username, firstname, lastname, country, streetaddress, apartment, towncity, postcodezip, phone, emailaddress, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [userId, ...params]);
        }
    }
};

module.exports = UserRepository;

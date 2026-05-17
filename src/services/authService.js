const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
//const { SECRET } = require('../middleware/authMiddleware');

const signup = async (userData) => {
    const { username, email, password } = userData;
    
    const emailExists = await userRepository.findByEmail(email);
    const userExists = await userRepository.findByUsername(username);
    
    if (emailExists || userExists) {
        return { error: emailExists ? "EMAIL_EXISTS" : "USERNAME_TAKEN" };
    }

    const hash = await bcrypt.hash(password, 10);
    await userRepository.create(username, email, hash);
    
    return { success: true };
};

const login = async (credentials) => {
    const { email, password } = credentials;
    const user = await userRepository.findByEmail(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return null;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

    return {
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
    };
};

module.exports = {
    signup,
    login
};

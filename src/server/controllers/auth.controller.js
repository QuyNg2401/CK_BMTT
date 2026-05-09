const AuthService = require('../services/auth.service');

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '';
};

const AuthController = {
    register: async (req, res) => {
        try {
            const {username, password} = req.body;
            if (!username || !password) {
                return res.status(400).json({message: 'Please enter all the required infomation'});
            }

            const userId = await AuthService.register(username, password);
            res.status(201).json({
                message: 'Registered successfully',
                userId
            });
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    },

    loginStep1: async (req, res) => {
        try {
            const {username, password} = req.body;
            const result = await AuthService.loginStep1(username, password);

            res.status(200).json({ data: result });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    verifyLoginStep2: async (req, res) => {
        try {
            const { userId, token } = req.body;
            const ipAddress = getClientIp(req);
            const result = await AuthService.verifyLoginStep2(userId, token, ipAddress);

            res.status(200).json({ data: result });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
}

module.exports = AuthController;
const { verify } = require('otplib');
const AuthService = require('../services/auth.service');

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

            res.status(201).json({
                message: 'Password verification successful!',
                data: result
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
}

module.exports = AuthController;
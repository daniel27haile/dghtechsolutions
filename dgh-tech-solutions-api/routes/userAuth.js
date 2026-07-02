const express         = require('express');
const { register, login, getMe } = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/userAuth');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login',    loginLimiter,    login);
router.get('/me',        protectUser,     getMe);

module.exports = router;

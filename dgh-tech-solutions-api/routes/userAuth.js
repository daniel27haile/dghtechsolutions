const express         = require('express');
const { register, login, getMe } = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/userAuth');

const router = express.Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protectUser, getMe);

module.exports = router;

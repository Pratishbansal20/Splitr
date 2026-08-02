const express = require('express');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/schemas');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.get('/users', auth, authController.listUsers);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;

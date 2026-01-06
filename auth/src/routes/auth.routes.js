const express = require('express');
const  validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register',validators.registerUserValidations,authController.registerUser);
router.post('/login',validators.loginUserValidations,authController.loginUser);


//GET /api/auth/me
router.get('/me',authMiddleware.authMiddleware,authController.getCurrentUser);
router.get('/logout',authController.logoutUser);

module.exports = router;

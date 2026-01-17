const express = require('express');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');
const router = express.Router();
const orderValidation = require('../middlewares/order.validation');

router.post('/',createAuthMiddleware(['user']),orderValidation.createOrderValidation,orderController.createOrder);


module.exports = router;
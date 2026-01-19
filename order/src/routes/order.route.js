const express = require('express');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');
const router = express.Router();
const orderValidation = require('../middlewares/order.validation');

router.post('/',createAuthMiddleware(['user']),orderValidation.createOrderValidation,orderController.createOrder);
router.get('/me',createAuthMiddleware(['user']),orderController.getMyOrders);
router.get('/:orderId',createAuthMiddleware(['user']),orderController.getOrderById);
router.post('/:orderId/cancel',createAuthMiddleware(['user']),orderController.cancelOrderById);
router.patch('/:orderId/address',createAuthMiddleware(['user']),orderController.updateOrderAddress);
module.exports = router; 
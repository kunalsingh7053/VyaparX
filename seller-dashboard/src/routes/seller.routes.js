const express = require('express');

const createAuthMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();
const controller = require('../controllers/seller.controller');

router.get('/metrics', createAuthMiddleware(["seller"]), controller.getSellerMatrics);
router.get('/orders',createAuthMiddleware(["seller"]), controller.getSellerOrders);
router.get('/products',createAuthMiddleware(["seller"]), controller.getSellerProducts);



module.exports = router;



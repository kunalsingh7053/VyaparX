const express = require('express');
const router = express.Router();
const createAuthMiddleware = require('../middlewares/auth.middlware');
const  cartController = require('../controllers/cart.controller');
const validation = require('../middlewares/validation.middleware');
router.post('/items',
    validation.validateAddItemToCart,
    createAuthMiddleware(['user']),
    cartController.addItemToCart
);

router.patch('/items/:productId',
    validation.validateUpdateCartItem,
    createAuthMiddleware(['user']),
    cartController.updateCartItem
);

// Public GET cart for tests (no auth)
router.get('/',createAuthMiddleware(['user']), cartController.getCart);

// Public deletes for tests (no auth)
router.delete('/items/:productId',createAuthMiddleware(['user']), cartController.removeCartItem);
router.delete('/', createAuthMiddleware(['user']), cartController.clearCart);


module.exports = router;
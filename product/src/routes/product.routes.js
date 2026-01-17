const express = require('express');
const multer = require('multer');
const createAuthMiddleware = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');
const { validateProductCreate } = require("../middleware/validator.middleware");
const router = express.Router();

// Multer setup for single image upload (in-memory)
const upload = multer({ storage: multer.memoryStorage() });



router.post(
	'/',
	createAuthMiddleware(['admin','seller']),
	upload.array('images', 5),
	...validateProductCreate,
	productController.createProduct
);

router.get('/', productController.getAllProducts);

router.patch(
	'/:id',
	createAuthMiddleware(['seller']),
	upload.array('images', 5),
	productController.updateProduct
);

router.delete(
	'/:id',
	createAuthMiddleware(['seller','admin']),
	productController.deleteProduct
);

router.get('/seller', createAuthMiddleware(['seller','admin']), productController.getProductBySeller);
router.get('/:id', productController.getProductById);
module.exports = router;

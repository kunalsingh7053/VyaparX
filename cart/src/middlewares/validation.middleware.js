const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
function validateResult(req,res,next){
const errors = validationResult(req);
if (!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});


}
next();
}

const validateAddItemToCart = [
    body('productId')
        .notEmpty().withMessage('productId is required')
        .isString().withMessage('productId must be a string')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid productId format');
            }
            return true;
        }),
    body('qty')
        .notEmpty().withMessage('qty is required')
        .isInt({ min: 1 }).withMessage('qty must be an integer greater than 0'),
    validateResult,
];
const validateUpdateCartItem = [
    param('productId')
        .notEmpty().withMessage('productId is required')
        .isString().withMessage('productId must be a string')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid productId format');
            }
            return true;
        }),
    body('qty')
        .notEmpty().withMessage('qty is required')
        .isInt({ min: 0 }).withMessage('qty must be an integer greater than or equal to 0'),
    validateResult,
];


module.exports = {
    validateAddItemToCart,
    validateUpdateCartItem
};
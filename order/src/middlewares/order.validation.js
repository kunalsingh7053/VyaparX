const {body, validationResult} = require('express-validator');

const respondValidationErrors = (req, res, next) => {
if (!validationResult(req).isEmpty()) {
    return res.status(400).json({ errors: validationResult(req).array() }); 



}
next();

};

const createOrderValidation = [
body('shippingAddress.street')
    .isString()
    .withMessage('Street must be a string')
    .notEmpty()
    .withMessage('Street is required'),

body('shippingAddress.city')
.isString()
.withMessage('City must be a string')
.notEmpty()
.withMessage('City is required'),

body('shippingAddress.state')
.isString()
.withMessage('State must be a string')
.notEmpty()
.withMessage('State is required'),

body('shippingAddress.pinCode')
.isNumeric() 
.withMessage('Zip code must be numeric'),

body('shippingAddress.country')
.isString()
.withMessage('Country must be a string')
.notEmpty()
.withMessage('Country is required'),


respondValidationErrors


]

const updateAddressValidation = [
body('shippingAddress.street')
    .optional()
    .isString()
    .withMessage('Street must be a string'),
body('shippingAddress.city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
body('shippingAddress.state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
body('shippingAddress.pinCode')
    .optional()
    .isNumeric()
    .withMessage('Zip code must be numeric'),
body('shippingAddress.country')
    .optional()
    .isString()
    .withMessage('Country must be a string'),
respondValidationErrors               


]

module.exports = {
    createOrderValidation,
    updateAddressValidation
}
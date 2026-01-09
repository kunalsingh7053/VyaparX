const { body, validationResult } = require('express-validator');

// Standardized error handler for validation results
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ error: 'Validation failed', details });
}

// Validation chain for creating a product
const validateProductCreate = [
  body('title')
    .exists({ checkFalsy: true }).withMessage('title is required')
    .isString().withMessage('title must be a string')
    .isLength({ min: 2, max: 200 }).withMessage('title must be 2-200 chars'),

  body('description')
    .optional({ nullable: true })
    .isString().withMessage('description must be a string')
    .isLength({ max: 2000 }).withMessage('description max length is 2000'),

  body('priceAmount')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('priceAmount is required')
    .isFloat({ gt: 0 }).withMessage('priceAmount must be a number > 0')
    .toFloat(),

  body('priceCurrency')
    .exists({ checkFalsy: true }).withMessage('priceCurrency is required')
    .isIn(['INR', 'USD']).withMessage('priceCurrency must be INR or USD'),

  body('category')
    .exists({ checkFalsy: true }).withMessage('category is required')
    .isString().withMessage('category must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('category must be 2-100 chars'),
    handleValidationErrors,
];


module.exports = {
  validateProductCreate,
  handleValidationErrors,
};

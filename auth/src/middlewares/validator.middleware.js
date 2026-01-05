const{body,validationResult} = require('express-validator');

const respondValidationErrors = (req,res,next)=>{
const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});


}
next();

}
const registerUserValidations = [
body('username').isString()
    .withMessage('Username must be a string')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({min:3})
    .withMessage('Username must be at least 3 characters long'),
body('email').isEmail()
    .withMessage('Invalid email format')
    .notEmpty()
    .withMessage('Email is required'),
body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({min:6})
    .withMessage('Password must be at least 6 characters long'),
body('fullName.firstName')
    .isString()
    .withMessage('First name must be a string')
    .notEmpty()
    .withMessage('First name is required'),
body('fullName.lastName')
    .isString()
    .withMessage('Last name must be a string')
    .notEmpty()
    .withMessage('Last name is required'),
    respondValidationErrors

]

module.exports = {
    registerUserValidations
}; 
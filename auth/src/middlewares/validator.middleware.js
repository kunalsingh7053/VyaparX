const{body,validationResult} = require('express-validator');
const { addUserAddress } = require('../controllers/auth.controller');

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
body('role')
    .optional()
    .isIn(['user','seller'])
    .withMessage('Role must be either user or admin'),
    respondValidationErrors

]

const loginUserValidations = [
body('email').optional().isEmail()
    .withMessage('Invalid email format'),

body('username').optional()
    .isString()
    .withMessage('Username must be a string'),    
body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required'),
    respondValidationErrors
]


const addUserAddressValidations = [
body('street')
    .isString()
    .withMessage('Street must be a string')
    .notEmpty()
    .withMessage('Street is required'),

body('city')
.isString()
.withMessage('City must be a string')
.notEmpty()
.withMessage('City is required'),

body('state')
.isString()
.withMessage('State must be a string')
.notEmpty()
.withMessage('State is required'),

body('pincode')
.isNumeric() 
.withMessage('Zip code must be numeric'),

body('country')
.isString()
.withMessage('Country must be a string')
.notEmpty()
.withMessage('Country is required'),

body('isDefault')
.optional()
.isBoolean()
.withMessage('isDefault must be a boolean'),

respondValidationErrors


]

module.exports = {
    registerUserValidations,
    loginUserValidations,
    addUserAddressValidations
}; 
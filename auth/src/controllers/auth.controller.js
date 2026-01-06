const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

async function registerUser(req,res){
try {
    
    const { username, email, password, fullName:{
        firstName, lastName
    } } = req.body;
    
    const isUserAlreadyExists = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    });
    if(isUserAlreadyExists){
        return res.status(409).json({message:'Username or Email already exists'});
    }
    const hash = await bcrypt.hash(password,10);
    const  user = await userModel.create({
        username,
        email,
        password:hash ,
        fullName:{
            firstName:firstName ,
            lastName:lastName
        }
    })
    
    const token = jwt.sign({
        id:user._id,
        username:user.username,
        email:user.email,
        role:user.role
    },process.env.JWT_SECRET,{
        expiresIn:'1d'
    })
    res.cookie('token',token,{
        httpOnly:true,
        secure:true,
        maxAge:24*60*60*1000 //day
    })
    
    res.status(201).json({
    
    message:'User registered successfully',
    user:{
        id:user._id,
        username:user.username,
        email:user.email,
        fullName:user.fullName,
        role:user.role
    }
    })
} catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({message:'Internal Server Error'});
    
}


}


async function loginUser(req,res){

try {
    const {username,email,password} = req.body;
    const user = await userModel.findOne({ $or:[
        {email},
        {username}
    ]}).select('+password');
    if(!user){
        return  res.status(401).json({message:'Invalid email or password'});
    }
    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return  res.status(401).json({message:'Invalid email or password'});
    }
    const token = jwt.sign({
        id:user._id,
        username:user.username,
        email:user.email,
        role:user.role
    },process.env.JWT_SECRET,{
        expiresIn:'1d'})

        res.cookie('token',token,{
            httpOnly:true,
            secure:true,
            maxAge:24*60*60*1000 //day
        })
    res.status(200).json({
        message:'Login successful',
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            fullName:user.fullName,
            role:user.role
        }
    });

} catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({message:'Internal Server Error'});
}


}


async function getCurrentUser(req,res){
return res.status(200).json({
    message:"Current user fetched successfully",
    user:req.user
});


}    

async function logoutUser(req, res) {

            const token = req.cookies.token;

            if (token) {
                // Attempt to blacklist token, but don't block logout on Redis availability
                Promise.resolve(
                    redis && typeof redis.set === 'function'
                        ? redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60)
                        : undefined
                ).catch(() => {});
            }

            // Always clear cookie and respond 200, even if no token was provided
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
            });
            return res.status(200).json({ message: 'Logout successful' });
        
        



}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser
};
const mongoose = require('mongoose');




const cartSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    items:[
  {
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        
        required:true,

    },
    qty:{
        type:Number,
        required:true,
        default:1
    }
  }


    ],
    totalPrice:{type:Number},
    
    
},{timestamps:true})

const Cart = mongoose.model('cart',cartSchema);

module.exports = cart;
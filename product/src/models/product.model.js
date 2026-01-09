const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    price:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            enum:['USD','INR'],
            default:'INR'
    }
},
seller:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
},
images:[{
    url:String,
    thumbnail:String,
    id:String
}],
category:{
    type:String,
    required:true
}

})

const Product = mongoose.model('product',productSchema);

module.exports = Product;
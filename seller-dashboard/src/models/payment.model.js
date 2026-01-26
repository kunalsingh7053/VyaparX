const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

order:{
    type:mongoose.Schema.Types.ObjectId,
    require:true,
},

paymentId:{
type:String,
require:true,
},

razorpayOrderId:{
type:String,
},

signature:{

type:String,

},

status:{
type:String,
enum:['pending','completed','failed'],
default:'pending'
},

user:{
    type:mongoose.Schema.Types.ObjectId,
    require:true,
},

price:{
    amount:{
        type:Number,
        require:true,
    },
    currency:{
        type:String,
        enum:['INR','USD'],
        default:'INR'

    }

}




},{timestamps:true});

const paymentModel = mongoose.model('payment', paymentSchema);

module.exports = paymentModel ;
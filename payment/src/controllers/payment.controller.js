require('dotenv').config();
const paymentModel = require('../models/payment.model');
const axios = require('axios');

const Razorpay = require('razorpay');
const publishToQueue = require('../broker/broker').publishToQueue;


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {
    
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
try {
    const orderId = req.params.orderId;
const orderResponse = await axios.get(`http://localhost:3003/api/orders/`+orderId, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const orderData = orderResponse.data;
console.log('Order Data:', orderResponse.data.totalAmount);
const price = orderResponse.data.totalAmount;
console.log('Price:', price);
    // const order = await razorpay.orders.create(price);
    const order = await razorpay.orders.create(price);

const payment = await paymentModel.create({
order:orderId,
razorpayOrderId:order.id,
user:req.user._id,
price:{
    amount:price.amount,
    currency:price.currency,

},


})
return res.status(201).json({message:"payment initiated", payment });
} catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
}
}

async function verifyPayment(req, res) {

    const {razorpayOrderId, razorpayPaymentId, razorpaySignature} = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET

      try {
            const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')
            const isValid = validatePaymentVerification({
                order_id: razorpayOrderId,
                payment_id: razorpayPaymentId,
            }, razorpaySignature, secret);  

          if(!isValid){
            return res.status(400).json({ error: 'Invalid payment signature' });
          }
          const payment = await paymentModel.findOne({ razorpayOrderId , status:'pending'});
           payment.paymentId = razorpayPaymentId;
              payment.signature = razorpaySignature;
                payment.status = 'completed';
            await payment.save();


 await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_COMPLETED', {
                orderId: razorpayOrderId,
                email:req.user.email,
                amount: payment.price.amount,
                currency: payment.price.currency,
                
                
 })

            return res.status(200).json({ message: 'Payment verified successfully', payment });
        
        
      } catch (error) {
        await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_FAILED', {
            email:req.user.email,
            paymentId: razorpayPaymentId,
            orderId: razorpayOrderId,
         


        })
        console.log('Error verifying payment:', error);
      }

}





module.exports = {
createPayment,
verifyPayment
}
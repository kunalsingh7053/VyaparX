const  {consumeFromQueue} = require('./broker');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const orderModel = require('../models/order.model');
const paymentModel = require('../models/payment.model');
module.exports = async function (){
    


consumeFromQueue('AUTH_SELLER_DASHBOARD.USER_CREATED', async (data) => {

await userModel.create(data);


})

consumeFromQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED', async (data) => {
await productModel.create(data);
})

consumeFromQueue('ORDER_SELLER_DASHBOARD.ORDER_CREATED',async (data) => {

await orderModel.create(data);

})


consumeFromQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED', async (data) => {

await paymentModel.create(data);


})
consumeFromQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE', async (data) => {

await paymentModel.findOneAndUpdate({orderId:data.orderId},data);


})

}
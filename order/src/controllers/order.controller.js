const orderModel = require('../models/order.model');
const axios = require('axios');
const mongoose = require('mongoose');



async function createOrder(req, res) {
    const userId = req.user.id;
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    try {
        //fetch user cart from cart service
        const cartResponse = await axios.get(`http://localhost:3002/api/cart/`,{
            headers: {
Authorization: `Bearer ${token}`

            }
        })
        const products = await Promise.all(cartResponse.data.cart.items.map(
            
            async(item)=>{
                console.log("Fetching product:", item.productId);
                return (await axios.get(`http://localhost:3001/api/products/${item.productId}`,{

                    headers:{
Authorization: `Bearer ${token}`
                    }
                })).data.data
            }
        ))
        console.log("Fetched products:", products);
        let priceAmount = 0;
      const orderItems = cartResponse.data.cart.items.map((item, index) => {
const product = products.find(p => p._id === item.productId);


       //if not in stock ,does not allow order creation
       if( product.stock < item.qty){
        
        throw new Error(`Product ${product.title} is out of stock`);
        
        
       }

        const itemTotal = product.price.amount * item.qty;
        priceAmount += itemTotal;

      return {
        product: item.productId,   // ✅ correct field name
        qty: item.qty,
        price: {
          amount: itemTotal,
          currency: product.price.currency
        }
    };


      })
        console.log("Total Price Amount:", priceAmount);
        console.log("Order Items:", orderItems);

        const order = await orderModel.create({ 
            user:userId,
            items:orderItems,
            status:'pending',
            totalAmount:{
                amount:priceAmount,
                currency:'INR'
            },
   
          shippingAddress:req.body.shippingAddress,
        })
        res.status(201).json({message:'Order Created Successfully', order});

    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error('Error fetching cart:', error);
        }
        res.status(500).json({message: 'Internal Server Error' , error: error.message});
    }


} 

async function getMyOrders(req, res) {
const user = req.user.id;
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

try{
    const orders = await orderModel.find({user}).skip(skip).limit(limit).sort({createdAt:-1});
    const totalOrders = await orderModel.countDocuments({user});
    res.status(200).json({
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        orders
    });
} catch (error) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching orders:', error);
    }
    res.status(500).json({message: 'Internal Server Error', error: error.message});
}

}

async function getOrderById(req, res) {

const userId = req.user.id;
const orderId = req.params.orderId;

// Validate orderId format
if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Invalid orderId' });
}

try {
    const order = await orderModel.findOne({_id:orderId, user:userId});
    if(!order){
        return res.status(404).json({message:'Order not found'});
    }
    res.status(200).json(order);
} catch (error) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching order by ID:', error);
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
}
}
 

async function cancelOrderById(req, res) {

const   user   = req.user.id;
const orderId = req.params.orderId;

// Validate orderId format
if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Invalid orderId' });
}

try{
    const order = await orderModel.findOne({_id:orderId, user});
    if(!order){
        return res.status(404).json({message:'Order not found'});
    }
    if(order.user.toString() !== user){
        return res.status(403).json({message:'Forbidden: You can only cancel your own orders'});
    }
    if(order.status !== 'pending'){
        return res.status(400).json({message:'Only pending orders can be cancelled'});
    }
    order.status = 'cancelled';
    await order.save();
    res.status(200).json({message:'Order cancelled successfully', order});

}
catch (error) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching order for cancellation:', error);
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });


}
}


async function updateOrderAddress(req, res) {
const userId = req.user.id;
const orderId = req.params.orderId;

// Validate orderId format
if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Invalid orderId' });
}

// Validate shipping address payload
const addr = req.body.shippingAddress;
if (!addr || !addr.street || !addr.city || !addr.state || !addr.pinCode || !addr.country) {
    return res.status(400).json({ message: 'Invalid shipping address' });
}

try {
    const order = await orderModel.findOne({ _id: orderId, user: userId });
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own orders' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ message: 'Only pending or confirmed orders can be updated' });
    }

    order.shippingAddress = {
        street: addr.street,
        city: addr.city,
        state: addr.state,
        pinCode: addr.pinCode,
        country: addr.country,
    };

    await order.save();
    res.status(200).json({ message: 'Order address updated successfully', order });
} catch (error) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Error updating order address:', error);
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
}




}

 

module.exports = {
createOrder,
getMyOrders,
getOrderById,
cancelOrderById,
updateOrderAddress
}
const orderModel = require('../models/order.model');
const axios = require('axios');



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
        console.error('Error fetching cart:', error);
        res.status(500).json({message: 'Internal Server Error' , error: error.message});
    }


}

 

 

module.exports = {
createOrder,
}
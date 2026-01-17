const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            qty: {
                type: Number,
                default: 1,
                min: 1,
            },
            price: {
                amount: {
                    type: Number,
                    required: true,
                },
                currency: {
                    type: String,
                    required: true,
                    enum: ['INR', 'USD'],
                    default: 'INR',
                }
            },
        }
    ],

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'shipped', 'delivered'],
        default: 'pending',
    },

    totalAmount: {
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            enum: ['INR', 'USD'],
            default: 'INR',
        }
    },

    shippingAddress:{
        type: addressSchema,
        required:true,
    }

}, { timestamps: true });

const Order = mongoose.model('order', orderSchema);

module.exports = Order;

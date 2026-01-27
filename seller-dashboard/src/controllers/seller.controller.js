const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const orderModel = require('../models/order.model');
const productModel = require('../models/product.model');
const paymentModel = require('../models/payment.model');


async function getSellerMatrics(req, res) {
try {
    const seller = req.user;
    const sellerId = seller?.id;
    if (!sellerId) {
        return res.status(400).json({ error: 'Seller id missing in token' });
    }

    const paidStatuses = ['confirmed', 'shipped', 'delivered'];

    // Summary: total revenue, items sold, orders count for this seller
    const summaryAgg = [
        { $match: { status: { $in: paidStatuses } } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product',
            },
        },
        { $unwind: '$product' },
        { $match: { 'product.seller': new mongoose.Types.ObjectId(sellerId) } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $multiply: ['$items.qty', '$items.price.amount'] } },
                totalItemsSold: { $sum: '$items.qty' },
                ordersSet: { $addToSet: '$_id' },
            },
        },
        {
            $project: {
                _id: 0,
                totalRevenue: 1,
                totalItemsSold: 1,
                ordersCount: { $size: '$ordersSet' },
            },
        },
    ];

    // Top products for this seller by quantity sold
    const topProductsAgg = [
        { $match: { status: { $in: paidStatuses } } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product',
            },
        },
        { $unwind: '$product' },
        { $match: { 'product.seller': new mongoose.Types.ObjectId(sellerId) } },
        {
            $group: {
                _id: '$items.product',
                productId: { $first: '$items.product' },
                title: { $first: '$product.title' },
                qtySold: { $sum: '$items.qty' },
                revenue: { $sum: { $multiply: ['$items.qty', '$items.price.amount'] } },
            },
        },
        { $sort: { qtySold: -1 } },
        { $limit: 5 },
        {
            $project: {
                _id: 0,
                productId: 1,
                title: 1,
                qtySold: 1,
                revenue: 1,
            },
        },
    ];

    const [summaryResult, topProductsResult] = await Promise.all([
        orderModel.aggregate(summaryAgg),
        orderModel.aggregate(topProductsAgg),
    ]);

    const summary = summaryResult?.[0] || { totalRevenue: 0, totalItemsSold: 0, ordersCount: 0 };

    return res.status(200).json({
        sales: {
            orders: summary.ordersCount,
            itemsSold: summary.totalItemsSold,
        },
        revenue: {
            total: summary.totalRevenue,
            currency: 'INR',
        },
        topProducts: topProductsResult,
    });

} catch (error) {
    console.error('Error fetching seller metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
    
}



}

async function getSellerOrders(req, res) {

try {
    const sellerId = req.user?.id;
    if (!sellerId) {
        return res.status(400).json({ error: 'Seller id missing in token' });
    }

    const { page = 1, limit = 20, status, from, to } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const match = {};
    if (status) {
        match.status = status;
    }
    // Optional date range filter on order creation time
    if (from || to) {
        match.createdAt = {};
        if (from) {
            const d = new Date(from);
            if (!isNaN(d)) match.createdAt.$gte = d;
        }
        if (to) {
            const d = new Date(to);
            if (!isNaN(d)) match.createdAt.$lte = d;
        }
        if (Object.keys(match.createdAt).length === 0) delete match.createdAt;
    }

    const pipeline = [
        { $match: match },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product',
            },
        },
        { $unwind: '$product' },
        { $match: { 'product.seller': new mongoose.Types.ObjectId(sellerId) } },
        {
            $group: {
                _id: '$_id',
                status: { $first: '$status' },
                user: { $first: '$user' },
                createdAt: { $first: '$createdAt' },
                items: {
                    $push: {
                        productId: '$items.product',
                        title: '$product.title',
                        qty: '$items.qty',
                        price: '$items.price',
                    },
                },
                subtotal: { $sum: { $multiply: ['$items.qty', '$items.price.amount'] } },
                currency: { $first: '$items.price.currency' },
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limitNum }],
                totalCount: [{ $count: 'count' }],
            },
        },
    ];

    const aggResult = await orderModel.aggregate(pipeline);
    const data = aggResult?.[0]?.data || [];
    const total = aggResult?.[0]?.totalCount?.[0]?.count || 0;

    return res.status(200).json({
        page: pageNum,
        limit: limitNum,
        total,
        orders: data.map((o) => ({
            orderId: o._id,
            status: o.status,
            userId: o.user,
            createdAt: o.createdAt,
            items: o.items,
            subtotal: o.subtotal,
            currency: o.currency || 'INR',
        })),
    });
} catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ error: 'Internal server error' });
}

}

async function getSellerProducts(req, res) {

try {
    
    const sellerId = req.user?.id;
    if (!sellerId) {
        return res.status(400).json({ error: 'Seller id missing in token' });
    }
    const products = await productModel.find({ seller: sellerId }).lean();
    return res.status(200).json({ products });

} catch (error) {
console.error('Error fetching seller products:', error);
res.status(500).json({ error: 'Internal server error' });    
}

}




module.exports = {
    getSellerMatrics,
    getSellerOrders,
    getSellerProducts,
};
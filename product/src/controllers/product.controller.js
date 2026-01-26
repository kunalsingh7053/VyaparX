const Product = require("../models/product.model");
const { uploadMultipleImages } = require("../services/imagekit.service")
const mongoose = require('mongoose');
const {publishToQueue} = require("../broker/broker");
async function createProduct(req, res) {
  try {
    const {
      title,
      description,
      priceAmount,
      priceCurrency,
      category,
      stock,
    } = req.body;

    const seller = req.user.id;

    if (!title || !priceAmount || !priceCurrency || !seller || !category || stock === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let images = [];
    if (req.files?.length) {
      images = await uploadMultipleImages(req.files);
    }

   const product = await Product.create({
  title,
  description,
  price: {
    amount: Number(priceAmount),
    currency: priceCurrency,
  },
  seller,
  category,
  stock: Number(stock),   // 👈 FIX
  images,
});
 
await publishToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED', product);

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllProducts(req, res) {

const {q, minprice, maxprice ,skip = 0 ,limit = 20} = req.query;

 const filter = {}

 if(q){

filter.$text = { $search:q }
 }
if(minprice)
{
  filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minprice) }
}
if(maxprice)
{
  filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxprice) }
}
const products = await Product.find(filter).skip(Number(skip)).limit(Number(limit));


res.status(200).json({data: products});

}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ data: product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  // Only the owning seller can update; admins could be allowed via route roles
  const product = await Product.findOne({ _id: id, seller: req.user.id });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const allow = ['title', 'description', 'priceAmount', 'priceCurrency', 'category', 'stock'];
  const updates = {};
  for (const key of allow) {
    if (req.body[key] !== undefined) {
      if (key === 'priceAmount') {
        updates['price.amount'] = req.body[key];
      } else if (key === 'priceCurrency') {
        updates['price.currency'] = req.body[key];
      } else {
        updates[key] = req.body[key];
      }
  }
}

  // Apply dot-notation updates to the document
  product.set(updates);
  await product.save();
  res.status(200).json({ message: 'product updated', data: product });
}

async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Allow admin to delete; otherwise only the owning seller
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this product' });
  }

  await Product.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: 'Product deleted successfully' });

}


async function getProductBySeller(req, res)
{
  const sellerId = req.user.id;

  const {skip = 0 ,limit = 20} = req.query;
  const products = await Product.find({seller:sellerId}).skip(Number(skip)).limit(Number(limit));
  res.status(200).json({data: products});
  
}
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductBySeller
}
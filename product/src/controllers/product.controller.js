const Product = require("../models/product.model");
const { uploadMultipleImages } = require("../services/imagekit.service")

async function createProduct(req, res) {
  try {
    const {
      title,
      description,
      priceAmount,
      priceCurrency,
      category
    } = req.body;

    const seller = req.user.id;

    if (!title || !priceAmount || !priceCurrency || !seller || !category) {
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
        amount: priceAmount,
        currency: priceCurrency,
      },
      seller,
      category,
      images,
    });

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createProduct };

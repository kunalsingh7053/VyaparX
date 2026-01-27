const express = require('express');

const app = express();
const sellerRoutes = require('./routes/seller.routes');
const cookiesParser = require('cookie-parser');

app.use(cookiesParser());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Seller Dashboard API is running');
});
app.use('/api/seller/dashboard', sellerRoutes);


module.exports = app;
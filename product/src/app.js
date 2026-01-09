const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const productRouter = require('./routes/product.routes');

app.use(express.json());
app.use(cookieParser());


app.use('/api/products',productRouter);



module.exports = app;
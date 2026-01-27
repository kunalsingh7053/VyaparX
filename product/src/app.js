const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const productRouter = require('./routes/product.routes');

app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('Welcome to the Product Service API');
});

app.use('/api/products',productRouter);



module.exports = app;
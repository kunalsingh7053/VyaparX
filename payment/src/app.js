const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const paymentRoutes = require('./routes/payment.routes');
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Payment Service is running');
});
app.use('/api/payments', paymentRoutes);
const publishToQueue = require('./broker/broker').publishToQueue;




module.exports = app;
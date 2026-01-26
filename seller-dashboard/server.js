require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const listener = require('./src/broker/listener');
const {connectRabbitMQ} = require('./src/broker/broker');
connectDB();
connectRabbitMQ().then(()=>{
    listener();
});


app.listen(3007,()=>{
console.log('Seller  Server running on port 3007');
})


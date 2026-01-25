require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const { connectRabbitMQ} = require('./src/borker/broker');
// Connect to the database
connectDB();
connectRabbitMQ();




app.listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('Press Ctrl+C to quit.');
});
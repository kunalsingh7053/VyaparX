const express = require('express');
const {connectRabbitMQ }    = require('./broker/broker');
const setListeners = require('./broker/listners');
const app = express();
connectRabbitMQ().then(()=>{
  setListeners();

})
app.get('/', (req, res) => {
    res.send('Notification Service is up and running!');
});





module.exports = app;   

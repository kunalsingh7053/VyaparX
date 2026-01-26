const express = require('express');

const app = express();
const cookiesParser = require('cookie-parser');

app.use(cookiesParser());
app.use(express.json());



module.exports = app;
require('@babel/register')({
  presets: ['@babel/preset-env'],
  ignore: ['node_modules']
});
const cors = require('cors');
const { METHODS } = require('http');
const { method } = require('koa/lib/request');
app.use(cors({
    origin: '*',
    methods: ['GET','POST']
}));

// Import the rest of our application.
module.exports = require('./server.js');

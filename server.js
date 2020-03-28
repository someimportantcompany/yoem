/* eslint-disable no-console */
const express = require('express');
const morgan = require('morgan');
const yoem = require('./');

const app = express();
app.use(morgan('tiny'));

app.get('/embed', yoem.express());

app.listen(3000, () => console.log('Listening on http://localhost:3000/'));

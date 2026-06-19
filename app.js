const express = require('express');
const path = require('path');
const conexion = require('./config/db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('login');
});

app.listen(4000, () => {
    console.log('Servidor ejecutándose en http://localhost:4000');
});
const express = require('express');
const path = require('path');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const incidenciaRoutes = require('./routes/incidenciaRoutes');
const historialRoutes = require('./routes/historialRoutes');

const app = express();

app.set('view engine', 'ejs');

// Como app.js ahora está dentro de backend,
// las vistas están en ../frontend/views
app.set('views', path.join(__dirname, '../frontend/views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Como public ahora está dentro de frontend,
// los CSS, JS e imágenes están en ../frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.use(session({
    secret: 'incidenciasTI',
    resave: false,
    saveUninitialized: false
}));

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(incidenciaRoutes);
app.use(historialRoutes);

app.use((req, res) => {
    res.status(404).render('error404');
});

app.listen(4000, () => {
    console.log('Servidor ejecutándose en http://localhost:4000');
});
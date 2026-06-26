const conexion = require('../config/db');

exports.mostrarLogin = (req, res) => {
    req.session.destroy(() => {
        res.render('login', { error: null });
    });
};

exports.login = (req, res) => {
    const { usuario, contrasena } = req.body;

    const sql = `
        SELECT *
        FROM usuario
        WHERE CT_Usuario = ?
        AND CT_Contrasena = ?
    `;

    conexion.query(sql, [usuario, contrasena], (error, resultados) => {
        if (error) {
            console.log(error);
            return res.render('login', {
                error: 'Error al iniciar sesión'
            });
        }

        if (resultados.length === 0) {
            return res.render('login', {
                error: 'Usuario o contraseña incorrectos'
            });
        }

        req.session.usuario = resultados[0];

        return res.redirect('/dashboard');
    });
};
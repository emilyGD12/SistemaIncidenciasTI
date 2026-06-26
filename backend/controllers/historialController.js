const conexion = require('../config/db');

// Historial del solicitante
exports.historialSolicitante = (req, res) => {
    const sql = `
        SELECT *
        FROM incidencia
        WHERE CI_IdUsuario = ?
        ORDER BY CF_Fecha_Creacion DESC
    `;

    conexion.query(sql, [req.session.usuario.CI_IdUsuario], (error, incidencias) => {
        if (error) {
            console.log(error);
            return res.send('Error al consultar el historial');
        }

        res.render('historialSolicitante', {
            incidencias: incidencias
        });
    });
};

// Historial del técnico
exports.historialTecnico = (req, res) => {
    const sql = `
        SELECT
            incidencia.*,
            usuario.CT_Nombre AS nombreSolicitante
        FROM incidencia
        INNER JOIN usuario ON incidencia.CI_IdUsuario = usuario.CI_IdUsuario
        WHERE incidencia.CT_Estado = 'Resuelta'
        ORDER BY incidencia.CF_Fecha_Creacion DESC
    `;

    conexion.query(sql, (error, incidencias) => {
        if (error) {
            console.log(error);
            return res.send('Error');
        }

        res.render('historialTecnico', {
            incidencias
        });
    });
};
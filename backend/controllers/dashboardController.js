const conexion = require('../config/db');

exports.dashboard = (req, res) => {
    const usuarioEncontrado = req.session.usuario;

    if (usuarioEncontrado.CT_Rol === 'Solicitante') {
        const sqlStats = `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN CT_Estado = 'En Proceso' THEN 1 ELSE 0 END) AS enProceso,
                SUM(CASE WHEN CT_Estado = 'Resuelta' THEN 1 ELSE 0 END) AS resueltas
            FROM incidencia
            WHERE CI_IdUsuario = ?
        `;

        conexion.query(sqlStats, [usuarioEncontrado.CI_IdUsuario], (error, resultadosStats) => {
            if (error) {
                console.log(error);
                return res.send('Error al cargar dashboard');
            }

            return res.render('dashboardSolicitante', {
                usuario: usuarioEncontrado,
                total: resultadosStats[0].total || 0,
                enProceso: resultadosStats[0].enProceso || 0,
                resueltas: resultadosStats[0].resueltas || 0
            });
        });

        return;
    }

    if (usuarioEncontrado.CT_Rol === 'Tecnico') {
        const sqlDashboardTecnico = `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN CT_Estado = 'Abierta' THEN 1 ELSE 0 END) AS abiertas,
                SUM(CASE WHEN CT_Estado = 'En Proceso' THEN 1 ELSE 0 END) AS enProceso,
                SUM(CASE WHEN CT_Estado = 'Resuelta' THEN 1 ELSE 0 END) AS resueltas,
                SUM(CASE WHEN CT_Prioridad = 'Baja' THEN 1 ELSE 0 END) AS baja,
                SUM(CASE WHEN CT_Prioridad = 'Media' THEN 1 ELSE 0 END) AS media,
                SUM(CASE WHEN CT_Prioridad = 'Alta' THEN 1 ELSE 0 END) AS alta
            FROM incidencia
        `;

        conexion.query(sqlDashboardTecnico, (error, resultadosStats) => {
            if (error) {
                console.log(error);
                return res.send('Error al cargar dashboard técnico');
            }

            return res.render('dashboardTecnico', {
                usuario: usuarioEncontrado,
                total: resultadosStats[0].total || 0,
                abiertas: resultadosStats[0].abiertas || 0,
                enProceso: resultadosStats[0].enProceso || 0,
                resueltas: resultadosStats[0].resueltas || 0,
                baja: resultadosStats[0].baja || 0,
                media: resultadosStats[0].media || 0,
                alta: resultadosStats[0].alta || 0
            });
        });

        return;
    }

    res.render('login', {
        error: 'Rol no válido'
    });
};
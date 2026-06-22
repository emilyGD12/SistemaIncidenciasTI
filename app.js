const express = require('express');
const path = require('path');
const conexion = require('./config/db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {

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

        const usuarioEncontrado = resultados[0];

     
        if (usuarioEncontrado.CT_Rol === 'Solicitante') {

            const sqlStats = `
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN CT_Estado = 'En Proceso' THEN 1 ELSE 0 END) AS enProceso,
                    SUM(CASE WHEN CT_Estado = 'Resuelta' THEN 1 ELSE 0 END) AS resueltas
                FROM incidencia
                WHERE CI_IdUsuario = ?
            `;

            conexion.query(
                sqlStats,
                [usuarioEncontrado.CI_IdUsuario],
                (error, resultadosStats) => {

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
                }
            );

            return;
        }

        // DASHBOARD TECNICO
       if (usuarioEncontrado.CT_Rol === 'Tecnico') {

    const sqlDashboardTecnico = `
        SELECT
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

    });

});

// NUEVA INCIDENCIA
app.get('/nueva-incidencia', (req, res) => {
    res.render('nuevaIncidencia');
});

app.post('/nueva-incidencia', (req, res) => {

    const { titulo, descripcion, prioridad } = req.body;

    const sql = `
        INSERT INTO incidencia
        (
            CT_Titulo,
            CT_Descripcion,
            CT_Prioridad,
            CT_Estado,
            CI_IdUsuario
        )
        VALUES
        (
            ?,
            ?,
            ?,
            'Abierta',
            ?
        )
    `;

    conexion.query(
        sql,
        [titulo, descripcion, prioridad, 1],
        (error) => {

            if (error) {
                console.log(error);
                return res.send('Error al registrar incidencia');
            }

            res.redirect('/mis-incidencias');
        }
    );
});

// MIS INCIDENCIAS
app.get('/mis-incidencias', (req, res) => {

    const sql = `
        SELECT *
        FROM incidencia
        WHERE CI_IdUsuario = ?
        ORDER BY CF_Fecha_Creacion DESC
    `;

    conexion.query(sql, [1], (error, incidencias) => {

        if (error) {
            console.log(error);
            return res.send('Error al consultar incidencias');
        }

        res.render('misIncidencias', {
            incidencias: incidencias
        });

    });

});

app.get('/incidencias-tecnico', (req, res) => {

    const sql = `
        SELECT *
        FROM incidencia
        ORDER BY CF_Fecha_Creacion DESC
    `;

    conexion.query(sql, (error, incidencias) => {

        if (error) {
            console.log(error);
            return res.send('Error');
        }

        res.render('incidenciasTecnico', {
            incidencias
        });

    });

});

app.get('/gestionar-incidencia/:id', (req, res) => {
    const id = req.params.id;

    const sqlIncidencia = `
        SELECT *
        FROM incidencia
        WHERE CI_IdIncidencia = ?
    `;

    conexion.query(sqlIncidencia, [id], (error, resultados) => {
        if (error) {
            console.log(error);
            return res.send('Error al cargar la incidencia');
        }

        if (resultados.length === 0) {
            return res.send('Incidencia no encontrada');
        }

        const sqlComentarios = `
            SELECT *
            FROM comentario
            WHERE CI_IdIncidencia = ?
            ORDER BY CF_Fecha DESC
        `;

        conexion.query(sqlComentarios, [id], (error, comentarios) => {
            if (error) {
                console.log(error);
                return res.send('Error al cargar comentarios');
            }

            res.render('gestionarIncidencia', {
                incidencia: resultados[0],
                comentarios: comentarios
            });
        });
    });
});
app.post('/actualizar-incidencia', (req, res) => {
    const { idIncidencia, estado, observacion } = req.body;

    const sqlActualizar = `
        UPDATE incidencia
        SET CT_Estado = ?
        WHERE CI_IdIncidencia = ?
    `;

    conexion.query(sqlActualizar, [estado, idIncidencia], (error) => {
        if (error) {
            console.log(error);
            return res.send('Error al actualizar la incidencia');
        }

        if (observacion && observacion.trim() !== '') {
            const sqlComentario = `
                INSERT INTO comentario
                (CT_Observacion, CI_IdIncidencia, CI_IdUsuario)
                VALUES (?, ?, ?)
            `;

            conexion.query(sqlComentario, [observacion, idIncidencia, 2], (error) => {
                if (error) {
                    console.log(error);
                    return res.send('Error al registrar la observación');
                }

                res.redirect('/incidencias-tecnico');
            });
        } else {
            res.redirect('/incidencias-tecnico');
        }
    });
});

app.listen(4000, () => {
    console.log('Servidor ejecutándose en http://localhost:4000');
});
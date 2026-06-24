const express = require('express');
const path = require('path');
const conexion = require('./config/db');

// para menejar sesiones de usuario
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// aqui se va a guardar el usuario que inicio sesion
app.use(session({
    secret: 'incidenciasTI',
    resave: false,
    saveUninitialized: false
}));

// Esta funcion revisa si hay sesion activa antes de dejar pasar a una ruta
function requiereSesion(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    next();
}

// Esta funcion revisa que el usuario tenga el rol de Tecnico
function requiereTecnico(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    if (req.session.usuario.CT_Rol !== 'Tecnico') {
        return res.redirect('/dashboard');
    }

    next();
}

// Esta funcion revisa que el usuario tenga el rol de Solicitante
function requiereSolicitante(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    if (req.session.usuario.CT_Rol !== 'Solicitante') {
        return res.redirect('/dashboard');
    }

    next();
}

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
        req.session.usuario = usuarioEncontrado;// Guardamos el usuario en la sesion para recordarlo en las demas paginas

     
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

    });

});

// DASHBOARD (cuando ya hay sesion activa, sin pedir login de nuevo)
app.get('/dashboard', requiereSesion, (req, res) => {

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

});

// NUEVA INCIDENCIA
app.get('/nueva-incidencia', requiereSolicitante, (req, res) => {
    res.render('nuevaIncidencia');
});

app.post('/nueva-incidencia', requiereSolicitante, (req, res) => {
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
        [titulo, descripcion, prioridad, req.session.usuario.CI_IdUsuario],
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
app.get('/mis-incidencias', requiereSolicitante, (req, res) => {

    const sql = `
        SELECT *
        FROM incidencia
        WHERE CI_IdUsuario = ?
        AND CT_Estado != 'Resuelta'
        ORDER BY CF_Fecha_Creacion DESC
    `;

    conexion.query(sql, [req.session.usuario.CI_IdUsuario], (error, incidencias) => {

        if (error) {
            console.log(error);
            return res.send('Error al consultar incidencias');
        }

        res.render('misIncidencias', {
            incidencias: incidencias
        });

    });

});

// HISTORIAL SOLICITANTE 
app.get('/historial-solicitante', requiereSolicitante, (req, res) => {

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

});

// DETALLE DE INCIDENCIA PARA EL SOLICITANTE (solo lectura)
app.get('/detalle-incidencia/:id', requiereSolicitante, (req, res) => {
    const id = req.params.id;

    const sqlIncidencia = `
        SELECT *
        FROM incidencia
        WHERE CI_IdIncidencia = ?
        AND CI_IdUsuario = ?
    `;

    conexion.query(sqlIncidencia, [id, req.session.usuario.CI_IdUsuario], (error, resultados) => {
        if (error) {
            console.log(error);
            return res.send('Error al cargar la incidencia');
        }

        if (resultados.length === 0) {
            return res.send('Incidencia no encontrada');
        }

        const sqlComentarios = `
            SELECT
                comentario.*,
                usuario.CT_Nombre AS nombreTecnico
            FROM comentario
            INNER JOIN usuario ON comentario.CI_IdUsuario = usuario.CI_IdUsuario
            WHERE comentario.CI_IdIncidencia = ?
            ORDER BY comentario.CF_Fecha DESC
        `;

        conexion.query(sqlComentarios, [id], (error, comentarios) => {
            if (error) {
                console.log(error);
                return res.send('Error al cargar comentarios');
            }

            res.render('detalleIncidencia', {
                incidencia: resultados[0],
                comentarios: comentarios
            });
        });
    });
});

// INCIDENIAS TECNICO
app.get('/incidencias-tecnico', requiereTecnico, (req, res) => {

    const sql = `
        SELECT
            incidencia.*,
            usuario.CT_Nombre AS nombreSolicitante
        FROM incidencia
        INNER JOIN usuario ON incidencia.CI_IdUsuario = usuario.CI_IdUsuario
        WHERE incidencia.CT_Estado != 'Resuelta'
        ORDER BY incidencia.CF_Fecha_Creacion DESC
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

// HISTORIAL TECNICO 
app.get('/historial-tecnico', requiereTecnico, (req, res) => {

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

});

app.get('/gestionar-incidencia/:id', requiereTecnico, (req, res) => {
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
            SELECT
            comentario.*,
            usuario.CT_Nombre AS nombreTecnico
            FROM comentario
            INNER JOIN usuario ON comentario.CI_IdUsuario = usuario.CI_IdUsuario
            WHERE comentario.CI_IdIncidencia = ?
            ORDER BY comentario.CF_Fecha DESC
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

app.post('/actualizar-incidencia', requiereTecnico, (req, res) => {
    const { idIncidencia, estado, observacion } = req.body;

    // Revisamos primero el estado actual antes de permitir el cambio
    const sqlVerificar = `
        SELECT CT_Estado
        FROM incidencia
        WHERE CI_IdIncidencia = ?
    `;

    conexion.query(sqlVerificar, [idIncidencia], (error, resultados) => {

        if (error) {
            console.log(error);
            return res.send('Error al verificar la incidencia');
        }

        if (resultados.length === 0) {
            return res.send('Incidencia no encontrada');
        }

        // Si ya esta Resuelta, no se permite ningun cambio
        if (resultados[0].CT_Estado === 'Resuelta') {
            return res.send('Esta incidencia ya fue resuelta y no puede modificarse');
        }

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

            // La observacion ya es obligatoria, pero igual validamos por seguridad
            if (observacion && observacion.trim() !== '') {
                const sqlComentario = `
                    INSERT INTO comentario
                    (CT_Observacion, CI_IdIncidencia, CI_IdUsuario)
                    VALUES (?, ?, ?)
                `;

                conexion.query(sqlComentario, [observacion, idIncidencia, req.session.usuario.CI_IdUsuario], (error) => {
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
});

// Si ninguna ruta anterior coincide, mostramos la pagina 404(algo basico)
app.use((req, res) => {
    res.status(404).render('error404');
});

app.listen(4000, () => {
    console.log('Servidor ejecutándose en http://localhost:4000');
});
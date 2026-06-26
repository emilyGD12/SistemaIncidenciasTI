const conexion = require('../config/db');

// Mostrar formulario de nueva incidencia
exports.mostrarNuevaIncidencia = (req, res) => {
    res.render('nuevaIncidencia');
};

// Guardar nueva incidencia
exports.registrarIncidencia = (req, res) => {
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
};

// Mis incidencias del solicitante
exports.misIncidencias = (req, res) => {
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
};

// Detalle de incidencia para solicitante
exports.detalleIncidencia = (req, res) => {
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
};

// Incidencias para técnico con filtros, búsqueda y contadores
exports.incidenciasTecnico = (req, res) => {
    const estado = req.query.estado;
    const busqueda = req.query.busqueda;

    let sql = `
        SELECT
            incidencia.*,
            usuario.CT_Nombre AS nombreSolicitante
        FROM incidencia
        INNER JOIN usuario ON incidencia.CI_IdUsuario = usuario.CI_IdUsuario
        WHERE 1 = 1
    `;

    const parametros = [];

    if (estado && estado !== 'Todas') {
        sql += ` AND incidencia.CT_Estado = ?`;
        parametros.push(estado);
    } else {
        sql += ` AND incidencia.CT_Estado != 'Resuelta'`;
    }

    if (busqueda && busqueda.trim() !== '') {
        sql += `
            AND (
                incidencia.CT_Titulo LIKE ?
                OR usuario.CT_Nombre LIKE ?
                OR incidencia.CT_Prioridad LIKE ?
                OR incidencia.CT_Estado LIKE ?
            )
        `;

        const textoBusqueda = `%${busqueda}%`;

        parametros.push(
            textoBusqueda,
            textoBusqueda,
            textoBusqueda,
            textoBusqueda
        );
    }

    sql += ` ORDER BY incidencia.CF_Fecha_Creacion DESC`;

    const sqlContadores = `
        SELECT
            SUM(CASE WHEN CT_Estado != 'Resuelta' THEN 1 ELSE 0 END) AS activas,
            SUM(CASE WHEN CT_Estado = 'Abierta' THEN 1 ELSE 0 END) AS abiertas,
            SUM(CASE WHEN CT_Estado = 'En Proceso' THEN 1 ELSE 0 END) AS enProceso,
            SUM(CASE WHEN CT_Estado = 'Resuelta' THEN 1 ELSE 0 END) AS resueltas
        FROM incidencia
    `;

    conexion.query(sql, parametros, (error, incidencias) => {
        if (error) {
            console.log(error);
            return res.send('Error al consultar incidencias');
        }

        conexion.query(sqlContadores, (errorContadores, resultadoContadores) => {
            if (errorContadores) {
                console.log(errorContadores);
                return res.send('Error al cargar contadores');
            }

            res.render('incidenciasTecnico', {
                incidencias,
                estadoSeleccionado: estado || 'Todas',
                busqueda: busqueda || '',
                contadores: resultadoContadores[0]
            });
        });
    });
};

// Gestionar incidencia para técnico
exports.gestionarIncidencia = (req, res) => {
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
};

// Actualizar estado y registrar observación
exports.actualizarIncidencia = (req, res) => {
    const { idIncidencia, estado, observacion } = req.body;

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
};
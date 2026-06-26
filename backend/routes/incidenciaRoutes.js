const express = require('express');
const router = express.Router();

const incidenciaController = require('../controllers/incidenciaController');

const {
    requiereSolicitante,
    requiereTecnico
} = require('../middleware/auth');

// Rutas del solicitante
router.get('/nueva-incidencia', requiereSolicitante, incidenciaController.mostrarNuevaIncidencia);
router.post('/nueva-incidencia', requiereSolicitante, incidenciaController.registrarIncidencia);
router.get('/mis-incidencias', requiereSolicitante, incidenciaController.misIncidencias);
router.get('/detalle-incidencia/:id', requiereSolicitante, incidenciaController.detalleIncidencia);

// Rutas del técnico
router.get('/incidencias-tecnico', requiereTecnico, incidenciaController.incidenciasTecnico);
router.get('/gestionar-incidencia/:id', requiereTecnico, incidenciaController.gestionarIncidencia);
router.post('/actualizar-incidencia', requiereTecnico, incidenciaController.actualizarIncidencia);

module.exports = router;
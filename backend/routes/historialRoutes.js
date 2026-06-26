const express = require('express');
const router = express.Router();

const historialController = require('../controllers/historialController');

const {
    requiereSolicitante,
    requiereTecnico
} = require('../middleware/auth');

router.get('/historial-solicitante', requiereSolicitante, historialController.historialSolicitante);
router.get('/historial-tecnico', requiereTecnico, historialController.historialTecnico);

module.exports = router;
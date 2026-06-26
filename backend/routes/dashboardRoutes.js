const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { requiereSesion } = require('../middleware/auth');

router.get('/dashboard', requiereSesion, dashboardController.dashboard);

module.exports = router;
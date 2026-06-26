const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.mostrarLogin);
router.post('/login', authController.login);

module.exports = router;
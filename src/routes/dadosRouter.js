// src/routes/dadosRoutes.js
const express = require('express');
const dadosController = require('../controllers/dadosController');

const router = express.Router();


router.get('/dados/:idUser', dadosController.getUsuarioById); 
router.get('/logs/:idUser', dadosController.getLogsByUserId);
router.post('/logs', dadosController.postNovoLog); 

module.exports = router;

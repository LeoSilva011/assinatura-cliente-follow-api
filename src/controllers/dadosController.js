// src/controllers/dadosController.js
const { query } = require('express');
const { connection } = require('../config');




const getUsuarioById = (req, res) => {
  const userId = req.params.idUser;

  connection.query('SELECT * FROM dados WHERE idUser = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuário por idUser no MySQL:', err);
      res.status(500).json({ error: 'Erro ao buscar usuário por idUser no MySQL' });
    } else {
      if (results.length > 0) {
        res.json(results[0]); // Retorna o primeiro usuário encontrado (deve ser único)
      } else {
        res.status(404).json({ message: 'Usuário não encontrado' });
      }
    }
  });
};

const getLogsByUserId = (req, res) => {
  const userId = req.params.idUser;

  connection.query('SELECT * FROM logs WHERE dados_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar logs por userId no MySQL:', err);
      res.status(500).json({ error: 'Erro ao buscar logs por userId no MySQL' });
    } else {
      res.json(results);
    }
  });
};

const postNovoLog = (req, res) => {
  const newLog = req.body;

  connection.query('INSERT INTO logs SET ?', newLog, (err, results) => {
    if (err) {
      console.error('Erro ao inserir novo log no MySQL:', err);
      res.status(500).json({ error: 'Erro ao inserir novo log no MySQL' });
    } else {
      console.log('Novo log inserido no MySQL:', results);
      res.json({ message: 'Novo log recebido e inserido no MySQL com sucesso.' });
    }
  });
};

module.exports = {
  
  
  getUsuarioById,
  getLogsByUserId,
  postNovoLog
};

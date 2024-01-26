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
  const newLogData = req.body;

  // Adicione logs para verificar os dados recebidos
  console.log('Dados recebidos:', newLogData);

  if (!newLogData || !newLogData.dados_id) {
    return res.status(400).json({ error: 'Dados inválidos no corpo da requisição. Certifique-se de incluir "dados_id" no corpo da requisição.' });
  }

  connection.query(
    'INSERT INTO logs (dados_id, data, hours, nameUserLog, email, cpf, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      newLogData.dados_id,
      newLogData.data,
      newLogData.hours,
      newLogData.nameUserLog,
      newLogData.email,
      newLogData.cpf,
      newLogData.status
    ],
    (err, results) => {
      if (err) {
        console.error('Erro ao inserir novo log no MySQL:', err);
        return res.status(500).json({ error: 'Erro ao inserir novo log no MySQL' });
      }

      console.log('Novo log inserido no MySQL:', results);
      res.json({ message: 'Novo log recebido e inserido no MySQL com sucesso.' });
    }
  );
};


module.exports = {
  
  
  getUsuarioById,
  getLogsByUserId,
  postNovoLog
};

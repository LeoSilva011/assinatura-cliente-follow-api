// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const dadosRoutes = require('./routes/dadosRoutes');

const app = express();
const port = 3000;

// Middleware para analisar dados do corpo de solicitações JSON
app.use(bodyParser.json());

// Configuração das rotas
app.use('/api', dadosRoutes);

// Inicie o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

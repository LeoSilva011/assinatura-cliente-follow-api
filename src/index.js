const express = require('express');
const cors = require('cors');
const { connection } = require('./config');
const dadosRoutes = require('./routes/dadosRouter');
const { criarPDF } = require('./geradorPDF');
const app = express();
const admin = require('firebase-admin');
const serviceAccount = require('./credencial-firebase/firebase-key.json');
const port = 3000;

// Configuração específica para permitir solicitações apenas de http://localhost:4200
const corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200,
};

// Verifica se o aplicativo já está inicializado antes de tentar inicializá-lo novamente
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'assinatura-follow.appspot.com',
  });
}

// Middleware para configurar o CORS com opções específicas
app.use(cors(corsOptions));

// Middleware para analisar dados do corpo de solicitações JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração das rotas
app.use('/api', dadosRoutes);

// Inicie o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Remova a chamada para criarPDF() se não for necessário no início da aplicação
// criarPDF();

/* 
VERSAO ANTIGA
// src/index.js
const express = require('express');
const dadosRoutes = require('./routes/dadosRouter');
const { connection } = require('./config');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

// Configuração específica para permitir solicitações apenas de http://localhost:3001
const corsOptions = {
  origin: 'http://localhost:4200/',
  optionsSuccessStatus: 200, // Algumas versões do navegador enviam status 204
};



// app.use('/api', (req, res, next) => {
//   // Adicione o cabeçalho 'Access-Control-Allow-Origin' manualmente
//   res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// }, dadosRoutes);

// Middleware para configurar o CORS com opções específicas
// app.use(cors(corsOptions));

// Middleware para analisar dados do corpo de solicitações JSON
app.use(express.json());

// Configuração das rotas
app.use('/api', dadosRoutes);

 // MIDDLEWARES
 app.use(bodyParser.json());

// Inicie o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});



*/
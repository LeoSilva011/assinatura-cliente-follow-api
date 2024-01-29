// src/config.js


const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
})
// Crie uma conexão com o MySQL
// const connection = mysql.createConnection(dbConfig);
pool.connect((err)=>{
  if (err) throw err;
  console.log("Connect to PostSQL successfully")
})
// Conecte-se ao MySQL
// connection.connect((err) => {
//   if (err) {
//     console.error('Erro ao conectar ao MySQL:', err);
//   } else {
//     console.log('Conexão bem-sucedida ao MySQL');
//   }
// });

// Exporte a conexão para que possa ser usada em outros módulos
module.exports = {
  pool,
  // Restante das suas configurações de dados aqui...
  // ...
};

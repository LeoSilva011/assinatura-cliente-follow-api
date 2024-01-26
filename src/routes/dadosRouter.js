// src/routes/dadosRoutes.js
const express = require('express');
const dadosController = require('../controllers/dadosController');
const fs = require('fs');

const router = express.Router();

router.get('/dados/:idUser', dadosController.getUsuarioById); 
router.get('/logs/:idUser', dadosController.getLogsByUserId);
router.post('/logs', dadosController.postNovoLog); 




const multer = require('multer');

// Configuração do multer para o upload de arquivos
const storage = multer.memoryStorage(); // Armazenar o arquivo em buffer na memória
const upload = multer({ storage });

router.post('/upload-pdfs', upload.fields([{ name: 'pdfFile1' }, { name: 'pdfFile2' }]), async (req, res) => {
  try {
    const pdfBuffer1 = req.files['pdfFile1'][0].buffer;
    const pdfBuffer2 = req.files['pdfFile2'][0].buffer;

    const pdfMescladoBytes = await dadosController.mesclarPDFs(pdfBuffer1, pdfBuffer2);

    // Caminho para salvar o PDF mesclado na pasta 'download' no sistema de arquivos
    const caminhoParaSalvar = 'src/download/resultado_mesclado.pdf';

    // Salva o PDF mesclado no sistema de arquivos
    fs.writeFileSync(caminhoParaSalvar, pdfMescladoBytes);

    // Configuração do cabeçalho para indicar que o conteúdo é um PDF
    res.setHeader('Content-Type', 'application/pdf');

    // Configuração do cabeçalho para indicar que é um arquivo para download
    res.setHeader('Content-Disposition', 'attachment; filename="resultado_mesclado.pdf"');

    // Envie o buffer do PDF mesclado como resposta
    res.send(pdfMescladoBytes);

    // Adicione a lógica para enviar o arquivo para o Firebase Storage aqui
    const admin = require('firebase-admin');
    const serviceAccount = require('../credencial-firebase/firebase-key.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'gs://assinatura-cliente-follow-api.appspot.com', // Substitua pelo seu URL do Firebase Storage
    });

    const bucket = admin.storage().bucket();

    // Caminho no Firebase Storage onde o arquivo será salvo
    const caminhoNoFirebaseStorage = 'teste/resultado_mesclado.pdf';

    // Upload do arquivo para o Firebase Storage
    await bucket.upload(caminhoParaSalvar, {
      destination: caminhoNoFirebaseStorage,
    });

    // URL do arquivo no Firebase Storage após o upload
    const urlDoFirebaseStorage = `https://storage.googleapis.com/${bucket.name}/${caminhoNoFirebaseStorage}`;
    console.log('Arquivo enviado para o Firebase Storage:', urlDoFirebaseStorage);
  } catch (error) {
    console.error('Erro ao processar o upload dos PDFs:', error);
    res.status(500).json({ erro: 'Erro ao processar o upload dos PDFs' });
  }
});


module.exports = router;

// src/routes/dadosRouter.js
const express = require('express');
const dadosController = require('../controllers/dadosController');
const fs = require('fs');
const router = express.Router();
const admin = require('firebase-admin');
const serviceAccount = require('../credencial-firebase/firebase-key.json');
const { Readable } = require('stream');


// Verifica se o aplicativo já está inicializado antes de tentar inicializá-lo novamente
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'assinatura-follow.appspot.com',
  });
}

router.get('/logs/:idUser', dadosController.getLogsByUserId);
router.post('/logs', dadosController.postNovoLog);

const multer = require('multer');
const upload = multer(); // Aqui você pode ajustar as configurações conforme necessário



router.get('/download-pdf/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
  
    // Gere o nome do arquivo com base no userId
    const nomeArquivo = `documento_assinado_${userId}`;
  
    // Caminho no Firebase Storage onde o arquivo foi salvo
    const caminhoNoFirebaseStorage = `teste/${nomeArquivo}.pdf`;

    // Obtenha o token de acesso para a URL
    const [urlDoFirebaseStorage] = await admin
      .storage()
      .bucket()
      .file(caminhoNoFirebaseStorage)
      .getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Defina a data de expiração conforme necessário
      });
  
    // Envie a URL do arquivo como resposta
    res.json({ url: urlDoFirebaseStorage });
  } catch (error) {
    console.error('Erro ao buscar o PDF no Firebase Storage:', error);
    res.status(500).json({ erro: 'Erro ao buscar o PDF no Firebase Storage' });
  }
});

const crypto = require('crypto');
const zlib = require('zlib');
router.post('/upload-pdfs/:userId', upload.fields([{ name: 'pdfFile1' }, { name: 'pdfFile2' }]), async (req, res) => {
  try {
    const userId = req.params.userId;
    const pdfBuffer1 = req.files['pdfFile1'][0].buffer;
    const pdfBuffer2 = req.files['pdfFile2'][0].buffer;

    // Mesclar os PDFs
    const pdfMescladoBytes = await dadosController.mesclarPDFs(pdfBuffer1, pdfBuffer2);

    // Comprimir o buffer do PDF mesclado
    const compressedPdfMescladoBytes = zlib.gzipSync(pdfMescladoBytes, { level: 9 });

    // Calcula um hash para o PDF
    const timestamp = new Date().getTime();
    const inputString = timestamp.toString();
    const hash = crypto.createHash('sha1').update(inputString).digest('hex');

    // Usar hash no nome do arquivo
    const nomeArquivo = `documento_assinado_${hash}.pdf`;

    // Caminho no Firebase Storage onde o arquivo será salvo
    const caminhoNoFirebaseStorage = `${userId}/${nomeArquivo}`;

    // Criar um stream a partir do buffer comprimido
    const bufferStream = new Readable();
    bufferStream.push(compressedPdfMescladoBytes);
    bufferStream.push(null);

    // Upload do arquivo para o Firebase Storage usando createWriteStream
    await admin.storage().bucket().file(caminhoNoFirebaseStorage).createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="${nomeArquivo}"`,
        contentEncoding: 'gzip', // Adicione o cabeçalho Content-Encoding
      },
    }).end(compressedPdfMescladoBytes);

    // Obter a URL assinada do Firebase Storage
    const [urlDoFirebaseStorage] = await admin
      .storage()
      .bucket()
      .file(caminhoNoFirebaseStorage)
      .getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Defina a data de expiração conforme necessário
      });

    // Enviar a URL do Firebase Storage como resposta
    res.json({ url: urlDoFirebaseStorage });
  } catch (error) {
    console.error('Erro ao processar o upload dos PDFs:', error);
    res.status(500).json({ erro: 'Erro ao processar o upload dos PDFs' });
  }
});

router.post('/mesclar-pdfs', async (req, res) => {
  try {
    const { pdfLinks } = req.body;

    if (!pdfLinks || !Array.isArray(pdfLinks) || pdfLinks.length < 2) {
      return res.status(400).json({ error: 'Forneça pelo menos dois links de PDF para mesclar.' });
    }

    const pdfMescladoBytes = await dadosController.mesclarPDFsPorLinks(pdfLinks);


    res.setHeader('Content-Type', 'application/pdf');

    
    res.setHeader('Content-Disposition', 'attachment; filename="documento_mesclado.pdf"');

    const pdfStream = new Readable();
    pdfStream.push(pdfMescladoBytes);
    pdfStream.push(null);

    pdfStream.pipe(res);
  } catch (error) {
    console.error('Erro ao mesclar e devolver PDFs por links:', error);
    res.status(500).json({ error: 'Erro ao mesclar e devolver PDFs por links' });
  }
});

router.get('/teste', (req, res) => {
  res.send('Bem-vindo à página principal!');
});

module.exports = router;

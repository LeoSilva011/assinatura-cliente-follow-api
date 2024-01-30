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
    storageBucket: 'assinatura-cliente-follow-api.appspot.com',
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
    const nomeArquivo = `resultado_mesclado_${userId}`;
  
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
router.post('/upload-pdfs/:userId', upload.fields([{ name: 'pdfFile1' }, { name: 'pdfFile2' }]), async (req, res) => {
  try {
    const userId = req.params.userId;
    const pdfBuffer1 = req.files['pdfFile1'][0].buffer;
    const pdfBuffer2 = req.files['pdfFile2'][0].buffer;

    // Mesclar os PDFs
    const pdfMescladoBytes = await dadosController.mesclarPDFs(pdfBuffer1, pdfBuffer2);

    // Usar userId no nome do arquivo
    const nomeArquivo = `resultado_mesclado_${userId}.pdf`;

    // Caminho no Firebase Storage onde o arquivo será salvo
    const caminhoNoFirebaseStorage = `teste/${nomeArquivo}`;

    // Criar um stream a partir do buffer
    const bufferStream = new Readable();
    bufferStream.push(pdfMescladoBytes);
    bufferStream.push(null);

    // Upload do arquivo para o Firebase Storage usando createWriteStream
    await admin.storage().bucket().file(caminhoNoFirebaseStorage).createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="${nomeArquivo}"`,
      },
    }).end(pdfMescladoBytes);

    // URL do arquivo no Firebase Storage após o upload
    const urlDoFirebaseStorage = `https://storage.googleapis.com/${admin.storage().bucket().name}/${caminhoNoFirebaseStorage}`;
    console.log('Arquivo enviado para o Firebase Storage:', urlDoFirebaseStorage);

    // Configurar cabeçalhos para indicar que o conteúdo é um PDF
    res.setHeader('Content-Type', 'application/pdf');

    // Configurar cabeçalhos para indicar que é um arquivo para download
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

    // Enviar o buffer do PDF mesclado como resposta
    res.send(pdfMescladoBytes);
  } catch (error) {
    console.error('Erro ao processar o upload dos PDFs:', error);
    res.status(500).json({ erro: 'Erro ao processar o upload dos PDFs' });
  }
});

router.get('/teste', (req, res) => {
  res.send('Bem-vindo à página principal!');
});

module.exports = router;

// src/routes/dadosRouter.js
const express = require('express');
const dadosController = require('../controllers/dadosController');
const fs = require('fs');
const router = express.Router();
const admin = require('firebase-admin');
const serviceAccount = require('../credencial-firebase/firebase-key.json');
const { Readable } = require('stream');
const axios = require ('axios');

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

router.post('/upload-pdfs/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const jsonData = req.body;

    // Verifica se o JSON possui a estrutura esperada
    if (!jsonData.urlAssinatura || !jsonData.contratos || !Array.isArray(jsonData.contratos)) {
      return res.status(400).json({ erro: 'JSON inválido. Certifique-se de incluir "urlAssinatura" e "contratos".' });
    }

    // Carrega o buffer da URL de assinatura
    const urlAssinaturaBuffer = await dadosController.fetchPdfBuffer(jsonData.urlAssinatura);

    // Processa cada contrato no JSON
    const contratosMesclados = await Promise.all(jsonData.contratos.map(async contrato => {
      const contratoBuffer = await dadosController.fetchPdfBuffer(contrato.pdf_url);
      const pdfMescladoBytes = await dadosController.mesclarPDFs(contratoBuffer, urlAssinaturaBuffer);
      
      const compressedPdfMescladoBytes = zlib.gzipSync(pdfMescladoBytes, { level: 9 });

      // Calcula um hash para o PDF
      const timestamp = new Date().getTime();
      const inputString = timestamp.toString();
      const hash = crypto.createHash('sha1').update(inputString).digest('hex');

      // Usar hash no nome do arquivo
      const nomeArquivo = `contrato_mesclado_${contrato.id}_${hash}.pdf`;

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

      return { id: contrato.id,title:contrato.title, url: urlDoFirebaseStorage };
    }));

    // Retorna o resultado como JSON
    res.json({ contratosMesclados });
  } catch (error) {
    console.error('Erro ao processar o upload dos PDFs:', error);
    res.status(500).json({ erro: 'Erro ao processar o upload dos PDFs' });
  }
});



router.post('/mesclar-pdfs', async (req, res) => {
  try {
    const { pdfLinks } = req.body;

  

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


router.post('/upload-assinatura/:userId', upload.single('pdfFile1'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const pdfBuffer1 = req.file.buffer;

    // Calcula um hash para o PDF
    const timestamp = new Date().getTime();
    const inputString = timestamp.toString();
    const hash = crypto.createHash('sha1').update(inputString).digest('hex');

    // Usar hash no nome do arquivo
    const nomeArquivo = `documento_assinatura_${hash}.pdf`;

    // Caminho no Firebase Storage onde o arquivo será salvo
    const caminhoNoFirebaseStorage = `${userId}/${nomeArquivo}`;

    // Upload do arquivo para o Firebase Storage
    const file = admin.storage().bucket().file(caminhoNoFirebaseStorage);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="${nomeArquivo}"`,
      },
    });

    stream.on('error', (err) => {
      console.error('Erro no stream de gravação:', err);
      res.status(500).json({ erro: 'Erro ao processar o upload do PDF' });
    });

    stream.on('finish', async () => {
      // Obter a URL assinada do Firebase Storage
      const [urlDoFirebaseStorage] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Defina a data de expiração conforme necessário
      });

      // Enviar a URL do Firebase Storage como resposta
      res.json({ url: urlDoFirebaseStorage });
    });

    // Inicia o stream de leitura do buffer do PDF
    const bufferStream = new Readable();
    bufferStream.push(pdfBuffer1);
    bufferStream.push(null);

    // Pipe o stream de leitura para o stream de gravação no Firebase Storage
    bufferStream.pipe(stream);

  } catch (error) {
    console.error('Erro ao processar o upload do PDF:', error);
    res.status(500).json({ erro: 'Erro ao processar o upload do PDF' });
  }
});

const JSZip = require('jszip');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);


router.post('/zip-files', async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'A lista de URLs é inválida.' });
  }

  try {
    const zip = new JSZip();

    // Itera sobre as URLs e baixa os arquivos
    await Promise.all(urls.map(async (url, index) => {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        zip.file(`file${index + 1}.pdf`, response.data);
      } catch (error) {
        console.error(`Erro ao baixar o arquivo da URL ${url}:`, error);
      }
    }));

    // Gera o arquivo ZIP
    const zipData = await zip.generateAsync({ type: 'nodebuffer' });

    // Salva o arquivo ZIP no disco
    await writeFileAsync('arquivos.zip', zipData);

    // Envia o arquivo ZIP como resposta
    res.download('arquivos.zip', 'arquivos.zip', (err) => {
      if (err) {
        console.error('Erro ao enviar o arquivo ZIP:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
      } else {
        // Remove o arquivo ZIP do disco após o download
        fs.unlink('arquivos.zip', (err) => {
          if (err) {
            console.error('Erro ao remover o arquivo ZIP:', err);
          }
        });
      }
    });
  } catch (error) {
    console.error('Erro ao criar o arquivo ZIP:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});



router.get('/teste', (req, res) => {
  res.send('Bem-vindo à página principal!');
});

module.exports = router;

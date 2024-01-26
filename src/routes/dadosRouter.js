// src/routes/dadosRoutes.js
const express = require('express');
const dadosController = require('../controllers/dadosController');

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
    
        // Configuração do cabeçalho para indicar que o conteúdo é um PDF
        res.setHeader('Content-Type', 'application/pdf');
    
        // Configuração do cabeçalho para indicar que é um arquivo para download
        res.setHeader('Content-Disposition', 'attachment; filename="resultado_mesclado.pdf"');
    
        // Envie o buffer do PDF mesclado como resposta
        res.send(pdfMescladoBytes);
      } catch (error) {
        console.error('Erro ao processar o upload dos PDFs:', error);
        res.status(500).json({ erro: 'Erro ao processar o upload dos PDFs' });
      }
  });

module.exports = router;

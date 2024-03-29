// src/controllers/dadosController.js
const { query } = require('express');
const { connection } = require('../config');
const { format } = require('date-fns');
const axios = require ('axios');


const mesclarPDFsPorLinks = async (pdfLinks) => {
  try {
    if (!pdfLinks || pdfLinks.length === 0) {
      throw new Error('Nenhum link fornecido para mesclar PDFs.');
    }

    if (pdfLinks.length === 1) {
      // Se houver apenas um link, retornar o PDF correspondente diretamente
      const response = await axios.get(pdfLinks[0], { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary');
    }

    // Se houver mais de um link, mesclar os PDFs
    const pdfBuffers = await Promise.all(pdfLinks.map(async (pdfLink) => {
      const response = await axios.get(pdfLink, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary');
    }));

    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return mergedPdf.save();
  } catch (error) {
    console.error('Erro ao mesclar ou retornar PDF por links:', error);
    throw error;
  }
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
    return res.status(400).json({
      error: 'Dados inválidos no corpo da requisição. Certifique-se de incluir "dados_id" no corpo da requisição.'
    });
  }

  // Adicione a data e hora atuais no formato desejado (DD-MM-YYYY e HH:mm:ss)
  const dataAtual = new Date();
  newLogData.data = format(dataAtual, 'dd-MM-yyyy');
  newLogData.hours = format(dataAtual, 'HH:mm:ss');

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
const PDFDocument = require('pdf-lib').PDFDocument
const fs = require('fs');


const mesclarPDFs = async (pdfBuffer1, pdfBuffer2) => {
  const mergedPdf = await PDFDocument.create();
  
  // Adiciona páginas do primeiro PDF
  const pdf1 = await PDFDocument.load(pdfBuffer1);
  const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
  copiedPages1.forEach((page) => mergedPdf.addPage(page));

  // Adiciona páginas do segundo PDF
  const pdf2 = await PDFDocument.load(pdfBuffer2);
  const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
  copiedPages2.forEach((page) => mergedPdf.addPage(page));

  // Salva o PDF mesclado como buffer
  const buf = await mergedPdf.save();

  return buf;
};

const fetchPdfBuffer  = async(pdfUrl)=> {
  try {
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Erro ao buscar o buffer do PDF:', error);
    throw new Error('Erro ao buscar o buffer do PDF');
  }
}

const mesclarPDFs2 = async(pdfBuffer1, pdfBuffer2)=> {
  const mergedPdf = await PDFDocument.create();

  const pdf1 = await PDFDocument.load(pdfBuffer1);
  const pdf2 = await PDFDocument.load(pdfBuffer2);

  const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
  const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());

  copiedPages1.forEach((page) => mergedPdf.addPage(page));
  copiedPages2.forEach((page) => mergedPdf.addPage(page));

  return await mergedPdf.save();
}




module.exports = {
  
  getLogsByUserId,
  postNovoLog,
  mesclarPDFsPorLinks,
  mesclarPDFs,
  fetchPdfBuffer,
  mesclarPDFs2
};

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function criarPDF() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    
    page.drawText('Conteúdo do PDF fictício para teste', { x: 50, y: 500 });

    const pdfBytes = await pdfDoc.save();

    const diretorioDestino = 'teste';  // Substitua pelo caminho do seu diretório
    const caminhoArquivo = path.join(diretorioDestino, 'teste.pdf');
    const caminhoArquivo2 = path.join(diretorioDestino, 'teste2.pdf');

    // Verifica se o diretório existe, se não, cria
    if (!fs.existsSync(diretorioDestino)) {
      fs.mkdirSync(diretorioDestino);
    }

    fs.writeFileSync(caminhoArquivo, pdfBytes);
    fs.writeFileSync(caminhoArquivo2, pdfBytes);

    console.log('PDF criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar PDF:', error);
  }
}

module.exports = { criarPDF };

const puppeteer = require('puppeteer');
const path = require('path');

async function generatePdf(htmlContent, outputPath) {
  const browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true // Use 'new' para versões mais recentes se necessário
  });
  const page = await browser.newPage();
  
  // Usar setContent é mais direto quando já temos o HTML como string
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.pdf({ 
      path: outputPath, 
      format: 'A4', 
      printBackground: true, // Essencial para aplicar cores e fundos do CSS
      margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
      } 
  });

  await browser.close();
}

module.exports = { generatePdf };
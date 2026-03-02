const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'TokenByU_Documentation_styled.html');
  console.log('Loading HTML from:', htmlPath);
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  
  console.log('Generating PDF...');
  await page.pdf({
    path: path.join(__dirname, 'TokenByU_Documentation.pdf'),
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:10px;text-align:center;width:100%;color:#666;">TokenByU - Documentación Completa</div>',
    footerTemplate: '<div style="font-size:10px;text-align:center;width:100%;color:#666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  console.log('PDF generated successfully!');
}

generatePDF().catch(console.error);

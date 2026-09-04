import * as pdfjsLib from 'pdfjs-dist';
import { FinancialTransaction, TransactionCategory } from '../models/types.js';
import { autoCategorizeConcepto, detectFugaInTransaction } from './bankImportService.js';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function parseBankPDF(
  fileBuffer: ArrayBuffer,
  titular: string = 'Titular Principal'
): Promise<FinancialTransaction[]> {
  const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
  const pdf = await loadingTask.promise;
  const transactions: FinancialTransaction[] = [];

  let fullTextLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    
    // Sort text items by vertical position (Y descending) then horizontal position (X ascending)
    const items = content.items as Array<{ str: string; transform: number[] }>;
    if (!items || items.length === 0) continue;

    // Group items into lines based on Y coordinate (transform[5])
    const lineMap = new Map<number, Array<{ x: number; text: string }>>();
    const tolerance = 4; // pixels tolerance for same line

    for (const item of items) {
      const text = item.str.trim();
      if (!text) continue;

      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);

      let foundYKey: number | null = null;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= tolerance) {
          foundYKey = existingY;
          break;
        }
      }

      if (foundYKey !== null) {
        lineMap.get(foundYKey)!.push({ x, text });
      } else {
        lineMap.set(y, [{ x, text }]);
      }
    }

    // Sort lines from top to bottom (Y descending)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineStr = lineItems.map(i => i.text).join(' ');
      fullTextLines.push(lineStr);
    }
  }

  // Parse lines into transactions
  // Example CaixaBank line: "TRASPASO PROPIO 31/07/2026 -600.00€ 598.34€"
  // Example: "TRANSFER INMEDIATA 30/07/2026 +1,299.38€ 1,299.60€"
  // Example: "DECIMAS 05/07/2026 +3.99€ 6.98€"
  // Pattern: [CONCEPTO...] [FECHA: DD/MM/YYYY] [IMPORTE: +/-xx.xx€] [SALDO]

  const dateRegex = /\b(\d{2}[-/]\d{2}[-/]\d{4})\b/;
  const amountRegex = /([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+[.,]\d{2})\s*€?/g;

  for (const line of fullTextLines) {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const fecha = dateMatch[1];
    const dateIndex = dateMatch.index!;

    // Concepto is everything before the date
    const rawConcepto = line.substring(0, dateIndex).trim();
    if (!rawConcepto || rawConcepto.toLowerCase().includes('concepto') || rawConcepto.toLowerCase().includes('titular')) {
      continue;
    }

    // Everything after the date contains importe and saldo
    const afterDate = line.substring(dateIndex + fecha.length).trim();
    const amounts = Array.from(afterDate.matchAll(amountRegex));

    if (amounts.length === 0) continue;

    // First amount after date is the transaction amount (importe)
    let amountStr = amounts[0][0].replace('€', '').trim();
    
    // Normalize format: 1,299.38 or 1.299,38 or -600.00
    let parsedAmount = 0;
    if (amountStr.includes(',') && amountStr.includes('.')) {
      if (amountStr.lastIndexOf(',') > amountStr.lastIndexOf('.')) {
        // European: 1.299,38
        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      } else {
        // American: 1,299.38
        amountStr = amountStr.replace(/,/g, '');
      }
    } else if (amountStr.includes(',')) {
      amountStr = amountStr.replace(',', '.');
    }

    parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount === 0) continue;

    const concepto = rawConcepto;
    const categoria = autoCategorizeConcepto(concepto);

    // Formatear mes YYYY-MM
    let mes = '';
    const parts = fecha.split(/[-/]/);
    if (parts.length === 3) {
      mes = `${parts[2]}-${parts[1]}`;
    } else {
      mes = new Date().toISOString().substring(0, 7);
    }

    transactions.push({
      id: 'tx_pdf_' + Math.random().toString(36).substring(2, 9),
      fecha,
      concepto,
      importe: parsedAmount,
      categoria,
      titular,
      mes,
      esFugaDetectada: detectFugaInTransaction(concepto, parsedAmount)
    });
  }

  return transactions;
}

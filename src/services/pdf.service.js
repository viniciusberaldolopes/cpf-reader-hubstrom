import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import { createWorker } from "tesseract.js";

// O worker processa o PDF fora da thread principal e evita travar a interface.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DOCUMENT_PATTERN =
  /\b(?:\d{3}\.\d{3}\.\d{3}-\d{2}|[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2})\b/i;

async function readPdf(file) {
  // O PDF.js recebe os bytes do arquivo em um ArrayBuffer.
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
  });

  return loadingTask.promise;
}

async function extractNativeText(pdf) {
  const pagesText = [];

  // A numeração de páginas no PDF.js começa em 1.
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    // Cada item representa um trecho de texto posicionado na página.
    const pageText = textContent.items.map((item) => item.str).join(" ");

    pagesText.push(pageText);
  }

  // Quebrar por página evita juntar a última palavra de uma página com a próxima.
  return pagesText.join("\n");
}

async function extractTextWithOcr(pdf, onProgress) {
  const pagesText = [];

  // Um único worker é reutilizado em todas as páginas para não carregar o idioma várias vezes.
  const worker = await createWorker("por", 1, {
    logger(message) {
      if (message.status !== "recognizing text") return;
      onProgress(Math.round(40 + message.progress * 20));
    },
  });

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 3 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: context, viewport }).promise;

      const result = await worker.recognize(canvas);
      pagesText.push(result.data.text);

      // Libera a memória da imagem assim que a página termina.
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await worker.terminate();
  }

  return pagesText.join("\n");
}

export async function extractTextFromPdf(file, onProgress = () => {}) {
  const pdf = await readPdf(file);
  const nativeText = await extractNativeText(pdf);

  // PDFs digitais seguem pelo caminho rápido. OCR é usado somente como fallback.
  if (DOCUMENT_PATTERN.test(nativeText)) return nativeText;

  const ocrText = await extractTextWithOcr(pdf, onProgress);
  return `${nativeText}\n${ocrText}`;
}

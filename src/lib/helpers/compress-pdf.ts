import { PDFDocument } from 'pdf-lib';

const MAX_PDF_SIZE = 4 * 1024 * 1024; // 4 Mo (Vercel serverless limit)

/**
 * Compresse un PDF côté client via pdf-lib (compression des streams, objet-streams xref).
 * Préserve la qualité vectorielle, le texte et les liens.
 * Typiquement 15-40% de réduction selon les PDFs.
 *
 * Lance une erreur si le PDF reste trop volumineux après compression.
 */
export async function compressPdf(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  const compressedFile = new File([compressed.buffer as ArrayBuffer], file.name, { type: 'application/pdf' });

  if (compressedFile.size > MAX_PDF_SIZE) {
    const sizeMo = (compressedFile.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `Le PDF est trop volumineux (${sizeMo} Mo après compression). Taille maximale : 4 Mo. ` +
      `Essayez de le compresser manuellement depuis Canva, Adobe Acrobat ou smallpdf.com.`
    );
  }

  return compressedFile;
}


import { PDFDocument } from 'pdf-lib';

/**
 * Extracts available metadata from the file buffer.
 * Supports deep inspection for PDFs and standard attributes for other files.
 */
export const extractMetadata = async (file: File, buffer: ArrayBuffer): Promise<Record<string, string>> => {
  const metadata: Record<string, string> = {};

  // 1. Standard File System Metadata
  metadata['File Name'] = file.name;
  metadata['File Size'] = `${(file.size / 1024).toFixed(2)} KB`;
  metadata['MIME Type'] = file.type || 'application/octet-stream';
  
  // Format Last Modified Date
  const lastMod = new Date(file.lastModified);
  metadata['Last Modified'] = lastMod.toUTCString();
  metadata['Timestamp (Unix)'] = file.lastModified.toString();

  // 2. Deep Inspection for PDFs
  if (file.type === 'application/pdf') {
    try {
      // Load PDF (Attempt to ignore encryption for metadata reading if possible)
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const subject = pdfDoc.getSubject();
      const creator = pdfDoc.getCreator();
      const producer = pdfDoc.getProducer();
      const creationDate = pdfDoc.getCreationDate();
      const modDate = pdfDoc.getModificationDate();
      const pageCount = pdfDoc.getPageCount();

      if (title) metadata['PDF Title'] = title;
      if (author) metadata['PDF Author'] = author;
      if (subject) metadata['PDF Subject'] = subject;
      if (creator) metadata['PDF Creator tool'] = creator;
      if (producer) metadata['PDF Producer'] = producer;
      if (creationDate) metadata['PDF Creation Date'] = creationDate.toUTCString();
      if (modDate) metadata['PDF Mod Date'] = modDate.toUTCString();
      metadata['Page Count'] = pageCount.toString();
      
    } catch (e) {
      console.warn("Metadata extraction warning:", e);
      metadata['PDF Analysis'] = "Encrypted or Corrupted Structure";
    }
  }

  // 3. Placeholder for Image EXIF (Requires additional library like exif-js, 
  // but strictly strictly using current imports, we limit to basic types)
  if (file.type.startsWith('image/')) {
      metadata['Image Analysis'] = 'Bitmap Data Present';
  }

  return metadata;
};

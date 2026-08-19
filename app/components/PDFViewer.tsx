// src/components/PDFViewer.tsx
import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// TypeScript کو CSS درآمدات کو نظر انداز کرنے دیں
// @ts-ignore
import 'react-pdf/dist/Page/AnnotationLayer.css';
// @ts-ignore
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js ورکر کا راستہ (CDN سے)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  // کلائنٹ سائڈ پر ونڈو کی چوڑائی حاصل کریں (SSR سے بچنے کے لیے)
  const [width, setWidth] = useState<number>(500);

  useEffect(() => {
    const updateWidth = () => {
      setWidth(Math.min(window.innerWidth * 0.6, 500));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
  };

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        📖 استاد نے ابھی تک کتاب اپ لوڈ نہیں کی۔
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full overflow-auto bg-gray-100 rounded">
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} className="shadow-lg">
        <Page pageNumber={pageNumber} width={width} />
      </Document>

      <div className="flex gap-4 mt-2 p-2 bg-white w-full justify-center sticky bottom-0 border-t">
        <button
          onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
        >
          پچھلا
        </button>
        <span className="py-1 px-3 bg-gray-200 rounded">
          {pageNumber} / {numPages || '?'}
        </span>
        <button
          onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages || prev))}
          disabled={pageNumber >= (numPages || 0)}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
        >
          اگلا
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
// Type declarations for pdf-parse module
// This file resolves the TypeScript error for missing pdf-parse types

declare module 'pdf-parse' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: {
      PDFFormatVersion?: string;
      IsAcroFormPresent?: boolean;
      IsXFAPresent?: boolean;
      [key: string]: any;
    };
    metadata: {
      [key: string]: any;
    };
    version?: string;
    numrender?: number;
    [key: string]: any;
  }

  interface PDFParseOptions {
    max?: number;
    pagerender?: (page: any) => void;
    password?: string;
    version?: string;
    [key: string]: any;
  }

  function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult>;

  export default pdfParse;
}

declare module 'pdf-parse/lib/pdf-parse' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info?: unknown;
    metadata?: unknown;
    version?: string | null;
    numrender?: number;
  }

  type PDFParseOptions = unknown;

  function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult>;

  export default pdfParse;
}
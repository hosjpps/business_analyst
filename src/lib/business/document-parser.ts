import type { DocumentInput, DocumentType } from '@/types/business';

// ===========================================
// Constants
// ===========================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_PAGES = 200;
const MAX_TEXT_LENGTH = 50000; // 50K characters per document

// ===========================================
// Types
// ===========================================

export interface ParsedDocument {
  name: string;
  type: DocumentType;
  text: string;
  pages?: number;
  truncated: boolean;
}

export interface ParseResult {
  documents: ParsedDocument[];
  total_text_length: number;
  errors: string[];
}

// ===========================================
// PDF Parser
// ===========================================

async function parsePDF(buffer: Buffer, name: string): Promise<ParsedDocument> {
  try {
    // Dynamic import - pdf-parse uses CommonJS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(buffer, {
      max: MAX_PDF_PAGES, // Limit pages
    });

    let text = data.text || '';
    let truncated = false;

    // Truncate if too long
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH);
      truncated = true;
    }

    return {
      name,
      type: 'pdf',
      text: text.trim(),
      pages: data.numpages,
      truncated,
    };
  } catch (error) {
    console.error(`Error parsing PDF ${name}:`, error);
    throw new Error(`Failed to parse PDF: ${name}`);
  }
}

// ===========================================
// DOCX Parser
// ===========================================

async function parseDOCX(buffer: Buffer, name: string): Promise<ParsedDocument> {
  try {
    const mammoth = await import('mammoth');

    const result = await mammoth.extractRawText({ buffer });

    let text = result.value || '';
    let truncated = false;

    // Truncate if too long
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH);
      truncated = true;
    }

    // Log warnings if any
    if (result.messages && result.messages.length > 0) {
      console.warn(`Warnings parsing DOCX ${name}:`, result.messages);
    }

    return {
      name,
      type: 'docx',
      text: text.trim(),
      truncated,
    };
  } catch (error) {
    console.error(`Error parsing DOCX ${name}:`, error);
    throw new Error(`Failed to parse DOCX: ${name}`);
  }
}

// ===========================================
// Plain Text Parser (MD, TXT)
// ===========================================

function parsePlainText(content: string, name: string, type: DocumentType): ParsedDocument {
  let text = content;
  let truncated = false;

  // Truncate if too long
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.substring(0, MAX_TEXT_LENGTH);
    truncated = true;
  }

  return {
    name,
    type,
    text: text.trim(),
    truncated,
  };
}

// ===========================================
// Main Parser
// ===========================================

export async function parseDocument(input: DocumentInput): Promise<ParsedDocument> {
  // Validate file size
  if (input.size > MAX_FILE_SIZE) {
    throw new Error(`File ${input.name} exceeds maximum size of 5MB`);
  }

  switch (input.type) {
    case 'pdf': {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.content, 'base64');
      return parsePDF(buffer, input.name);
    }

    case 'docx': {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.content, 'base64');
      return parseDOCX(buffer, input.name);
    }

    case 'md':
    case 'txt': {
      // Plain text - content is already text, not base64
      return parsePlainText(input.content, input.name, input.type);
    }

    default:
      throw new Error(`Unsupported document type: ${(input as DocumentInput).type}`);
  }
}

// ===========================================
// Batch Parser
// ===========================================

export async function parseDocuments(inputs: DocumentInput[]): Promise<ParseResult> {
  const documents: ParsedDocument[] = [];
  const errors: string[] = [];
  let total_text_length = 0;

  for (const input of inputs) {
    try {
      const parsed = await parseDocument(input);
      documents.push(parsed);
      total_text_length += parsed.text.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${input.name}: ${message}`);
      console.error(`Failed to parse document ${input.name}:`, error);
    }
  }

  return {
    documents,
    total_text_length,
    errors,
  };
}

// ===========================================
// Utilities
// ===========================================

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '\n\n[... truncated ...]';
}

export function getDocumentTypeFromFilename(filename: string): DocumentType | null {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'md':
      return 'md';
    case 'txt':
      return 'txt';
    default:
      return null;
  }
}

export function isValidDocumentType(filename: string): boolean {
  return getDocumentTypeFromFilename(filename) !== null;
}

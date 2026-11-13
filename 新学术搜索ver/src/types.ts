export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  publishedDate: string;
  venue: string;
  citations: number;
  categories: string[];
  pdfUrl: string;
  arxivId?: string;
  doi?: string;
  isOpenAccess?: boolean;
  type?: 'paper' | 'book' | 'thesis' | 'special' | 'dataset'; // 资源类型
  relevance?: 'Perfect' | 'Partial';
  relevanceReason?: string;
  isSearchExample?: boolean;
}

export interface FilterOptions {
  years: number[];
  categories: string[];
  sortBy: 'relevance' | 'date' | 'citations';
}

export type DocumentElementType = 'title' | 'author' | 'paragraph' | 'heading' | 'image' | 'formula' | 'table';

export interface DocumentElement {
  id: string;
  type: DocumentElementType;
  content: string;
  level?: number; // For headings
  caption?: string; // For images/tables
  translation?: string;
  translating?: boolean;
}

export interface ParsedDocument {
  paperId: string;
  elements: DocumentElement[];
}

export interface Comment {
  id: string;
  elementId: string;
  content: string;
  author: string;
  timestamp: string;
}

export interface Note {
  id: string;
  elementId: string;
  content: string;
  timestamp: string;
}

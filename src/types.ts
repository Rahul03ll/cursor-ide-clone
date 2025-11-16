// Basic file type
export interface File {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

// Project definition
export interface Project {
  id: string;
  name: string;
  files: File[];
  rootPath: string;
}

// Editor position type
export interface EditorPosition {
  lineNumber: number;
  column: number;
}

// Settings types
export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  theme: string;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off';
  tabCompletion: 'on' | 'off';
  formatOnSave: boolean;
}

// Keyboard shortcut definition
export interface KeyboardShortcut {
  id: string;
  name: string;
  keybinding: string;
  command: string;
  context: string;
  isCustom?: boolean;
  isModified?: boolean;
}

// Search options
export interface SearchOptions {
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
  searchInSelection: boolean;
  replaceAll: boolean;
}

// Types for our AI components
export interface AICompletionRequest {
  code: string;
  language: string;
  cursorPosition: EditorPosition;
  prompt?: string;
}

export interface AICompletionResponse {
  completion: string;
  alternatives?: string[];
  explanations?: string;
}

export interface DocstringGenerationRequest {
  code: string;
  language: string;
  functionSelection?: string;
}

export interface DocstringGenerationResponse {
  docstring: string;
  insertPosition: EditorPosition;
}

// Code snippets
export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

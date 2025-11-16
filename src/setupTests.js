// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Electron APIs
global.window = {
  electron: {
    ipcRenderer: {
      invoke: jest.fn(async (channel, ...args) => {
        if (channel === 'save-code-file') {
          return { success: true, path: `electron:${args[0]}` };
        }
        if (channel === 'load-code-file') {
          return { success: true, code: 'mock code content' };
        }
        if (channel === 'list-code-files') {
          return { success: true, files: [] };
        }
        if (channel === 'delete-code-file') {
          return { success: true };
        }
        return { success: false, error: 'Unknown channel' };
      })
    }
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => {
    return null;
  }),
  setItem: jest.fn((key, value) => {
    // Store in memory
  }),
  removeItem: jest.fn((key) => {
    // Remove from memory
  }),
  clear: jest.fn(() => {
    // Clear all
  })
};

global.localStorage = localStorageMock;

// Mock Gemini API to avoid rate limiting
jest.mock('./services/gemini-api', () => {
  const mockStreamGenerateCode = jest.fn((prompt, model, system, onChunk, onComplete, onError) => {
    // Simulate streaming response with proper async handling
    Promise.resolve().then(() => {
      if (onChunk) {
        onChunk('def hello():\n');
        onChunk('    print("Hello, World!")\n');
      }
      if (onComplete) {
        onComplete('def hello():\n    print("Hello, World!")\n');
      }
    }).catch((error) => {
      if (onError) {
        onError(error);
      }
    });
  });

  const mockGenerateCode = jest.fn(async (prompt, model, system) => {
    return 'def hello():\n    print("Hello, World!")\n';
  });

  return {
    streamGenerateCode: mockStreamGenerateCode,
    generateCode: mockGenerateCode,
    AI_MODELS: {
      gemini: {
        id: 'gemini-2.0-flash',
        name: 'Google Gemini 2.0 Flash',
        description: 'Fast and reliable free Google AI model for code generation',
        contextLength: 1000000,
        isFree: true
      }
    }
  };
});

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});


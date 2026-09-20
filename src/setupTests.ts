// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock DOM APIs that are missing in JSDOM
if (typeof window !== 'undefined') {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  }
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  }
  if (!window.HTMLElement.prototype.setPointerCapture) {
    window.HTMLElement.prototype.setPointerCapture = jest.fn();
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  }

  // Mock ResizeObserver
  (window as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Stateful, in-memory localStorage mock for unit tests
  class LocalStorageMock implements Storage {
    private store = new Map<string, string>();

    get length(): number {
      return this.store.size;
    }

    clear(): void {
      this.store.clear();
    }

    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number): string | null {
      const keys = Array.from(this.store.keys());
      return keys[index] || null;
    }

    removeItem(key: string): void {
      this.store.delete(key);
    }

    setItem(key: string, value: string): void {
      this.store.set(key, String(value));
    }
  }

  const memoryStorage = new LocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    writable: true,
  });
}

// Mock Unified AI API code generation methods to avoid live network calls in tests
jest.mock('./services/unified-api', () => {
  const actual = jest.requireActual('./services/unified-api');
  return {
    ...actual,
    streamGenerateCode: jest.fn(
      (prompt: string, model: string, system: string, onChunk?: (chunk: string) => void, onComplete?: (full: string) => void, onError?: (err: any) => void) => {
        const response = 'def hello():\n    print("Hello, World!")\n    return True\n';
        setTimeout(() => {
          if (onChunk) {
            onChunk('def hello():\n');
            onChunk('    print("Hello, World!")\n');
          }
          if (onComplete) {
            onComplete(response);
          }
        }, 10);
      }
    ),
    generateCode: jest.fn(async () => {
      return 'def hello():\n    print("Hello, World!")\n    return True\n';
    }),
  };
});

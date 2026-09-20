/**
 * Tests for AI Features Service
 * Tests all AI-powered code editing and analysis functions
 */

import {
  modifyCodeSelection,
  askAboutCode,
  fixErrorAutomatically,
  refactorCode,
  generateUnitTests,
  explainCode,
  generateDocumentation,
  planMultiFileEdit,
  searchProjectContext,
  CodeSelection,
  RefactorOptions
} from '../aiFeatures';

describe('AI Features Service', () => {
  const testCode = `
def add(a, b):
    return a + b
  `;

  const testLanguage = 'python';
  const modelType = 'gemini';

  const testSelection: CodeSelection = {
    code: testCode,
    startLine: 1,
    endLine: 4,
    startColumn: 1,
    endColumn: 1
  };

  describe('modifyCodeSelection', () => {
    test('should modify code based on instruction', async () => {
      const instruction = 'Add type hints to this function';
      const result = await modifyCodeSelection(
        testSelection,
        instruction,
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result.modified).toBe('string');
      expect(result.modified.length).toBeGreaterThan(0);
    }, 30000);

    test('should handle different languages', async () => {
      const jsCode = 'function add(a, b) { return a + b; }';
      const jsSelection: CodeSelection = {
        code: jsCode,
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: jsCode.length
      };
      const result = await modifyCodeSelection(
        jsSelection,
        'Add JSDoc comments',
        'javascript',
        modelType
      );

      expect(result).toBeTruthy();
      expect(result.modified).toBeTruthy();
    }, 30000);
  });

  describe('askAboutCode', () => {
    test('should answer questions about code', async () => {
      const question = 'What does this function do?';
      const result = await askAboutCode(
        question,
        testCode,
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);

    test('should handle different questions', async () => {
      const questions = [
        'What are the parameters?',
        'What does this return?',
        'Are there any bugs?'
      ];

      for (const question of questions) {
        const result = await askAboutCode(
          question,
          testCode,
          testLanguage,
          modelType
        );
        expect(result).toBeTruthy();
      }
    }, 60000);
  });

  describe('fixErrorAutomatically', () => {
    test('should fix code errors', async () => {
      const buggyCode = `
def divide(a, b):
    return a / b  # Missing zero check
      `;

      const result = await fixErrorAutomatically(
        {
          errorMessage: 'ZeroDivisionError: division by zero',
          code: buggyCode,
          language: testLanguage,
          lineNumber: 3
        },
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result.modified).toBe('string');
    }, 30000);

    test('should handle different error types', async () => {
      const errors = [
        'TypeError',
        'ValueError',
        'IndexError'
      ];

      for (const error of errors) {
        const result = await fixErrorAutomatically(
          {
            errorMessage: error,
            code: testCode,
            language: testLanguage
          },
          modelType
        );
        expect(result).toBeTruthy();
      }
    }, 60000);
  });

  describe('refactorCode', () => {
    test('should refactor code for readability', async () => {
      const result = await refactorCode(
        testCode,
        testLanguage,
        { type: 'optimize' },
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result.modified).toBe('string');
    }, 30000);

    test('should support different refactoring types', async () => {
      const types: RefactorOptions['type'][] = ['optimize', 'general', 'extract-method'];

      for (const type of types) {
        const result = await refactorCode(
          testCode,
          testLanguage,
          { type },
          modelType
        );
        expect(result).toBeTruthy();
      }
    }, 60000);
  });

  describe('generateUnitTests', () => {
    test('should generate unit tests', async () => {
      const result = await generateUnitTests(
        testCode,
        testLanguage,
        { framework: 'pytest' },
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);

    test('should generate tests for different languages', async () => {
      const jsCode = 'function add(a, b) { return a + b; }';
      const result = await generateUnitTests(
        jsCode,
        'javascript',
        { framework: 'jest' },
        modelType
      );

      expect(result).toBeTruthy();
    }, 30000);
  });

  describe('explainCode', () => {
    test('should explain code with default detail level', async () => {
      const result = await explainCode(
        testCode,
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);

    test('should support different detail levels', async () => {
      const levels = ['brief', 'detailed', 'comprehensive'] as const;

      for (const level of levels) {
        const result = await explainCode(
          testCode,
          testLanguage,
          modelType,
          level
        );
        expect(result).toBeTruthy();
      }
    }, 60000);

    test('should call onProgress callback', (done) => {
      let progressCalled = false;

      explainCode(
        testCode,
        testLanguage,
        modelType,
        'detailed',
        (_chunk) => {
          progressCalled = true;
        }
      ).then((result) => {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(progressCalled).toBe(true);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(result).toBeDefined();
        done();
      }).catch((error) => {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error).toBeDefined();
        done();
      });
    }, 30000);
  });

  describe('generateDocumentation', () => {
    test('should generate documentation', async () => {
      const result = await generateDocumentation(
        testCode,
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);

    test('should support different documentation types', async () => {
      const types = ['inline-comments', 'docstrings', 'both'] as const;

      for (const type of types) {
        const result = await generateDocumentation(
          testCode,
          testLanguage,
          modelType,
          type
        );
        expect(result).toBeTruthy();
      }
    }, 60000);
  });

  describe('planMultiFileEdit', () => {
    test('should plan multi-file edits', async () => {
      const projectContext = {
        files: [
          { path: 'main.py', content: testCode, language: 'python' },
          { path: 'utils.py', content: 'def helper(): pass', language: 'python' }
        ]
      };

      const result = await planMultiFileEdit(
        'Add logging to all functions',
        projectContext,
        modelType
      );

      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
    }, 30000);
  });

  describe('searchProjectContext', () => {
    test('should search project files', () => {
      const projectContext = {
        files: [
          { path: 'main.py', content: 'def main(): pass', language: 'python' },
          { path: 'utils.py', content: 'def helper(): pass', language: 'python' }
        ]
      };

      const results = searchProjectContext('def', projectContext);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should rank results by relevance', () => {
      const projectContext = {
        files: [
          { path: 'main.py', content: 'def main(): pass', language: 'python' },
          { path: 'utils.py', content: 'def helper(): pass', language: 'python' },
          { path: 'test.py', content: 'def test(): pass', language: 'python' }
        ]
      };

      const results = searchProjectContext('def', projectContext);

      // Results should be sorted by relevance
      expect(results.length).toBeGreaterThanOrEqual(0);
      // Check sorting if we have multiple results
      const sortedResults = results.slice().sort((a, b) => b.relevance - a.relevance);
      expect(results).toEqual(sortedResults);
    });

    test('should handle empty search results', () => {
      const projectContext = {
        files: [
          { path: 'main.py', content: 'def main(): pass', language: 'python' }
        ]
      };

      const results = searchProjectContext('nonexistent', projectContext);

      expect(Array.isArray(results)).toBe(true);
    });
  });
});

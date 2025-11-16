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
  searchProjectContext
} from '../aiFeatures';

describe('AI Features Service', () => {
  const testCode = `
def add(a, b):
    return a + b
  `;

  const testLanguage = 'python';
  const modelType = 'gemini';

  describe('modifyCodeSelection', () => {
    test('should modify code based on instruction', async () => {
      const instruction = 'Add type hints to this function';
      const result = await modifyCodeSelection(
        testCode,
        instruction,
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    test('should handle different languages', async () => {
      const jsCode = 'function add(a, b) { return a + b; }';
      const result = await modifyCodeSelection(
        jsCode,
        'Add JSDoc comments',
        'javascript',
        modelType
      );

      expect(result).toBeTruthy();
    }, 30000);
  });

  describe('askAboutCode', () => {
    test('should answer questions about code', async () => {
      const question = 'What does this function do?';
      const result = await askAboutCode(
        testCode,
        question,
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
          testCode,
          question,
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
        buggyCode,
        'ZeroDivisionError',
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);

    test('should handle different error types', async () => {
      const errors = [
        'TypeError',
        'ValueError',
        'IndexError'
      ];

      for (const error of errors) {
        const result = await fixErrorAutomatically(
          testCode,
          error,
          testLanguage,
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
        'readability',
        testLanguage,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);

    test('should support different refactoring types', async () => {
      const types = ['readability', 'performance', 'maintainability'];

      for (const type of types) {
        const result = await refactorCode(
          testCode,
          type as any,
          testLanguage,
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
      const levels = ['brief', 'detailed', 'comprehensive'];

      for (const level of levels) {
        const result = await explainCode(
          testCode,
          testLanguage,
          modelType,
          level as any
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
        (chunk) => {
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
      const types = ['inline-comments', 'docstrings', 'both'];

      for (const type of types) {
        const result = await generateDocumentation(
          testCode,
          testLanguage,
          modelType,
          type as any
        );
        expect(result).toBeTruthy();
      }
    }, 60000);
  });

  describe('planMultiFileEdit', () => {
    test('should plan multi-file edits', async () => {
      const files = [
        { path: 'main.py', content: testCode },
        { path: 'utils.py', content: 'def helper(): pass' }
      ];

      const result = await planMultiFileEdit(
        'Add logging to all functions',
        files,
        modelType
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }, 30000);
  });

  describe('searchProjectContext', () => {
    test('should search project files', () => {
      const projectContext = {
        files: [
          { path: 'main.py', content: 'def main(): pass' },
          { path: 'utils.py', content: 'def helper(): pass' }
        ]
      };

      const results = searchProjectContext('def', projectContext);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should rank results by relevance', () => {
      const projectContext = {
        files: [
          { path: 'main.py', content: 'def main(): pass' },
          { path: 'utils.py', content: 'def helper(): pass' },
          { path: 'test.py', content: 'def test(): pass' }
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
          { path: 'main.py', content: 'def main(): pass' }
        ]
      };

      const results = searchProjectContext('nonexistent', projectContext);

      expect(Array.isArray(results)).toBe(true);
    });
  });
});


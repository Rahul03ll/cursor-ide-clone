/**
 * Tests for Code Utilities
 * Tests code extraction, parsing, and manipulation functions
 */

import { extractCodeFromResponse, countLinesOfCode, getLanguageForFile } from '../codeUtils';

describe('Code Utilities', () => {
  describe('extractCodeFromResponse', () => {
    test('should extract HTML code from response', () => {
      const response = `
Here's the HTML code:
\`\`\`html
<div>Hello World</div>
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.htmlContent).toContain('Hello World');
    });

    test('should extract CSS code from response', () => {
      const response = `
Here's the CSS:
\`\`\`css
body { color: red; }
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.cssContent).toContain('color: red');
    });

    test('should extract JavaScript code from response', () => {
      const response = `
Here's the JavaScript:
\`\`\`javascript
console.log('Hello');
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.jsContent).toContain('console.log');
    });

    test('should extract JS code (shorthand)', () => {
      const response = `
\`\`\`js
alert('test');
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.jsContent).toContain('alert');
    });

    test('should handle multiple code blocks', () => {
      const response = `
\`\`\`html
<div>HTML</div>
\`\`\`

\`\`\`css
body { margin: 0; }
\`\`\`

\`\`\`javascript
console.log('JS');
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.htmlContent).toContain('HTML');
      expect(result.cssContent).toContain('margin');
      expect(result.jsContent).toContain('console.log');
    });

    test('should provide defaults when no code found', () => {
      const response = 'No code here';

      const result = extractCodeFromResponse(response);

      expect(result.htmlContent).toBeTruthy();
      expect(result.cssContent).toBeTruthy();
      expect(result.jsContent).toBeTruthy();
    });

    test('should handle empty response', () => {
      const result = extractCodeFromResponse('');

      expect(result.htmlContent).toBeTruthy();
      expect(result.cssContent).toBeTruthy();
      expect(result.jsContent).toBeTruthy();
    });

    test('should handle case-insensitive code blocks', () => {
      const response = `
\`\`\`HTML
<p>Test</p>
\`\`\`

\`\`\`CSS
div { color: blue; }
\`\`\`

\`\`\`JAVASCRIPT
var x = 1;
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.htmlContent).toContain('Test');
      expect(result.cssContent).toContain('blue');
      expect(result.jsContent).toContain('var x');
    });
  });

  describe('countLinesOfCode', () => {
    test('should count lines in simple code', () => {
      const code = `
def hello():
    print("Hello")
    return True
      `;

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });

    test('should handle empty code', () => {
      const count = countLinesOfCode('');

      expect(count).toBe(0);
    });

    test('should count lines with comments', () => {
      const code = `
# This is a comment
def test():
    # Another comment
    pass
      `;

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });

    test('should count lines with blank lines', () => {
      const code = `
def test():
    pass


def another():
    pass
      `;

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });

    test('should handle multiline strings', () => {
      const code = `
def test():
    text = """
    This is a
    multiline string
    """
    pass
      `;

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('getLanguageForFile', () => {
    test('should identify Python files', () => {
      const language = getLanguageForFile('test.py');

      expect(language).toBe('python');
    });

    test('should identify JavaScript files', () => {
      const language = getLanguageForFile('test.js');

      expect(language).toBe('javascript');
    });

    test('should identify TypeScript files', () => {
      const language = getLanguageForFile('test.ts');

      expect(language).toBe('typescript');
    });

    test('should identify Java files', () => {
      const language = getLanguageForFile('Test.java');

      expect(language).toBe('java');
    });

    test('should identify C++ files', () => {
      const language = getLanguageForFile('test.cpp');

      expect(language).toBe('cpp');
    });

    test('should handle uppercase extensions', () => {
      const language = getLanguageForFile('TEST.PY');

      expect(language).toBe('python');
    });

    test('should handle files without extension', () => {
      const language = getLanguageForFile('Makefile');

      expect(language).toBeTruthy();
    });

    test('should return default for unknown extensions', () => {
      const language = getLanguageForFile('test.unknown');

      expect(language).toBeTruthy();
    });
  });

  describe('Code Extraction Edge Cases', () => {
    test('should handle nested code blocks', () => {
      const response = `
\`\`\`html
<div>
  <style>
    body { color: red; }
  </style>
</div>
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.htmlContent).toContain('style');
    });

    test('should handle code with special characters', () => {
      const response = `
\`\`\`javascript
const regex = /test[a-z]+/gi;
const str = "test & special < > chars";
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.jsContent).toContain('regex');
    });

    test('should handle code with backticks inside', () => {
      const response = `
\`\`\`javascript
const template = \`Hello \${name}\`;
\`\`\`
      `;

      const result = extractCodeFromResponse(response);

      expect(result.jsContent).toBeTruthy();
    });
  });

  describe('Line Counting Edge Cases', () => {
    test('should handle Windows line endings', () => {
      const code = 'line1\r\nline2\r\nline3';

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });

    test('should handle Unix line endings', () => {
      const code = 'line1\nline2\nline3';

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });

    test('should handle mixed line endings', () => {
      const code = 'line1\r\nline2\nline3\r\n';

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });

    test('should handle code with only whitespace', () => {
      const code = '   \n   \n   ';

      const count = countLinesOfCode(code);

      expect(count).toBeGreaterThan(0);
    });
  });
});


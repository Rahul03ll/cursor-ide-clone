/**
 * Tests for Google Gemini API Service
 * Tests all AI code generation and streaming functions
 */

import { streamGenerateCode, generateCode, AI_MODELS } from '../gemini-api';

describe('Gemini API Service', () => {
  const originalEnv = process.env.REACT_APP_GEMINI_API_KEY;
  const originalFetch = global.fetch;

  const testPrompt = 'Write a simple hello world function in Python';
  const testSystemPrompt = 'You are a helpful coding assistant';
  const modelType = 'gemini';

  beforeEach(() => {
    process.env.REACT_APP_GEMINI_API_KEY = 'test-gemini-api-key';
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: 'def hello_world():\n' },
                  { text: '    print("Hello, World!")\n' },
                  { text: '    return True\n' },
                ],
              },
            },
          ],
        }),
      } as any;
    });
  });

  afterEach(() => {
    process.env.REACT_APP_GEMINI_API_KEY = originalEnv;
    global.fetch = originalFetch;
  });

  describe('AI_MODELS Configuration', () => {
    test('should have gemini model configured', () => {
      expect(AI_MODELS.gemini).toBeDefined();
      expect(AI_MODELS.gemini.id).toBe('gemini-2.0-flash');
      expect(AI_MODELS.gemini.name).toContain('Gemini');
      expect(AI_MODELS.gemini.isFree).toBe(true);
    });

    test('should have correct context length', () => {
      expect(AI_MODELS.gemini.contextLength).toBe(1000000);
    });

    test('should have description', () => {
      expect(AI_MODELS.gemini.description).toBeTruthy();
      expect(AI_MODELS.gemini.description.length).toBeGreaterThan(0);
    });
  });

  describe('streamGenerateCode', () => {
    test('should call onChunk callback with streaming data', (done) => {
      const chunks: string[] = [];

      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        (chunk) => {
          chunks.push(chunk);
        },
        (fullResponse) => {
          expect(fullResponse).toBeTruthy();
          expect(chunks.length).toBeGreaterThan(0);
          done();
        },
        (error) => {
          done(error);
        }
      );
    });

    test('should handle API errors gracefully', (done) => {
      global.fetch = jest.fn().mockImplementation(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal Server Error' } }),
      }));

      streamGenerateCode(
        '',
        modelType,
        testSystemPrompt,
        () => {},
        () => {},
        (error) => {
          expect(error).toBeDefined();
          expect(error.message).toContain('Internal Server Error');
          done();
        }
      );
    });

    test('should accumulate chunks into complete response', (done) => {
      const chunks: string[] = [];

      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        (chunk) => {
          chunks.push(chunk);
        },
        (fullResponse) => {
          const accumulated = chunks.join('');
          expect(fullResponse).toBe(accumulated);
          done();
        },
        (error) => {
          done(error);
        }
      );
    });
  });

  describe('generateCode', () => {
    test('should return complete code response', async () => {
      const response = await generateCode(
        testPrompt,
        modelType,
        testSystemPrompt
      );

      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should handle different prompts', async () => {
      const prompts = [
        'Write a function to add two numbers',
        'Create a class for a Person',
        'Write a recursive fibonacci function',
      ];

      for (const prompt of prompts) {
        const response = await generateCode(prompt, modelType, testSystemPrompt);
        expect(response).toBeTruthy();
        expect(response.length).toBeGreaterThan(0);
      }
    });

    test('should use default system prompt if not provided', async () => {
      const response = await generateCode(testPrompt, modelType);
      expect(response).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing API key gracefully', (done) => {
      process.env.REACT_APP_GEMINI_API_KEY = '';

      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        () => {},
        () => {},
        (error) => {
          expect(error).toBeDefined();
          expect(error.message).toContain('No API key configured');
          done();
        }
      );
    });

    test('should handle network errors', (done) => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        () => {},
        () => {},
        (error) => {
          expect(error).toBeDefined();
          expect(error.message).toBe('Network error');
          done();
        }
      );
    });
  });

  describe('Response Format', () => {
    test('should return valid response format', async () => {
      const response = await generateCode(
        'Write a hello world function',
        modelType,
        testSystemPrompt
      );

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should handle code blocks in response', async () => {
      const response = await generateCode(
        'Write Python code to print hello world',
        modelType,
        testSystemPrompt
      );

      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(0);
    });
  });
});

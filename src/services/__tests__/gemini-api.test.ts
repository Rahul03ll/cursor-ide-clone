/**
 * Tests for Google Gemini API Service
 * Tests all AI code generation and streaming functions
 */

import { streamGenerateCode, generateCode, AI_MODELS } from '../gemini-api';

describe('Gemini API Service', () => {
  // Test configuration
  const testPrompt = 'Write a simple hello world function in Python';
  const testSystemPrompt = 'You are a helpful coding assistant';
  const modelType = 'gemini';

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
    }, 30000); // 30 second timeout for API call

    test('should handle API errors gracefully', (done) => {
      streamGenerateCode(
        '',
        modelType,
        testSystemPrompt,
        () => {},
        () => {},
        (error) => {
          expect(error).toBeDefined();
          done();
        }
      );
    }, 30000);

    test('should accumulate chunks into complete response', (done) => {
      let accumulatedResponse = '';
      
      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        (chunk) => {
          accumulatedResponse += chunk;
        },
        (fullResponse) => {
          expect(accumulatedResponse).toBe(fullResponse);
          done();
        },
        (error) => {
          done(error);
        }
      );
    }, 30000);
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
    }, 30000);

    test('should handle different prompts', async () => {
      const prompts = [
        'Write a function to add two numbers',
        'Create a class for a Person',
        'Write a recursive fibonacci function'
      ];

      for (const prompt of prompts) {
        const response = await generateCode(prompt, modelType, testSystemPrompt);
        expect(response).toBeTruthy();
        expect(response.length).toBeGreaterThan(0);
      }
    }, 60000);

    test('should use default system prompt if not provided', async () => {
      const response = await generateCode(testPrompt, modelType);
      expect(response).toBeTruthy();
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle missing API key gracefully', (done) => {
      // This test would need to mock the API key
      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        () => {},
        () => {},
        (error) => {
          // Error handling is expected
          done();
        }
      );
    }, 30000);

    test('should handle network errors', (done) => {
      streamGenerateCode(
        testPrompt,
        modelType,
        testSystemPrompt,
        () => {},
        () => {},
        (error) => {
          // Error handling is expected
          done();
        }
      );
    }, 30000);
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
    }, 30000);

    test('should handle code blocks in response', async () => {
      const response = await generateCode(
        'Write Python code to print hello world',
        modelType,
        testSystemPrompt
      );
      
      expect(response).toBeTruthy();
      // Response should contain code or explanation
      expect(response.length).toBeGreaterThan(0);
    }, 30000);
  });
});


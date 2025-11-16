import axios, { AxiosInstance } from 'axios';

// Type definitions
interface AIConfig {
  type: 'gemini' | 'local';
  endpoint: string;
  apiKey?: string;
  model?: string;
  enabled?: boolean;
}

// Configuration - Google Gemini (FREE API - No credit card required!)
// Get your free API key from: https://makersuite.google.com/app/apikey
const config = {
  gemini: {
    enabled: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    // You can set your API key here or in .env file
    // Get free key from: https://makersuite.google.com/app/apikey
    apiKey: process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDUme9r8t3NhZ0KqJGxJ5Y8vZ9X4kF5nQs', // Free API key
    model: 'gemini-1.5-flash' // Fast and free model
  }
};

// Get the active configuration - Google Gemini
const getActiveConfig = (): AIConfig => {
  console.log('Using Google Gemini (FREE) with model:', config.gemini.model);
  return {
    type: 'gemini',
    endpoint: config.gemini.endpoint,
    apiKey: config.gemini.apiKey,
    model: config.gemini.model,
    enabled: true
  };
};

// Get active configuration and validate it
const activeConfig = getActiveConfig();

// Log configuration
console.log('AI Configuration:');
console.log('- Mode: Google Gemini (FREE - No credit card required)');
console.log('- Model:', activeConfig.model);
console.log('- Endpoint:', activeConfig.endpoint);

// Type for model selection - supporting multiple AI providers
export type ModelType = 'gemini' | 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet';

// Model configuration - Multiple AI Providers
export const AI_MODELS = {
  gemini: {
    id: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash',
    description: 'Fast and reliable free Google AI model for code generation',
    contextLength: 1000000, // 1M tokens!
    isFree: true,
    provider: 'Google'
  },
  'gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI\'s most capable model, great for complex tasks',
    contextLength: 128000,
    isFree: false,
    provider: 'OpenAI'
  },
  'gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient model for most tasks',
    contextLength: 128000,
    isFree: false,
    provider: 'OpenAI'
  },
  'claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Advanced reasoning and analysis capabilities',
    contextLength: 200000,
    isFree: false,
    provider: 'Anthropic'
  }
};

// Interface for chat messages
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Interface for completion requests
export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: string };
}

// Interface for completion response
export interface CompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

// Interface for streaming response chunks
export interface StreamingResponseChunk {
  id?: string;
  choices?: Array<{
    // OpenAI format
    delta?: {
      content?: string;
      role?: string;
    };
    // Gemini format
    content?: string;
    index: number;
    finish_reason?: string | null;
    stop_reason?: string | null;
  }>;
  // Gemini format
  message?: {
    role?: string;
    content: string;
  };
  model?: string;
  created?: number;
  object?: string;
}

// Error type definition
export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

// Create an axios instance with default configs for Gemini
const createApiClient = (): AxiosInstance => {
  const activeConfig = getActiveConfig();
  
  // For Gemini, we use the direct endpoint
  const baseURL = activeConfig.endpoint;
  
  const client = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 120000, // 2 minutes timeout for Gemini API requests
  });
  
  // Add request interceptor for Gemini API
  client.interceptors.request.use(config => {
    // Add API key to request params for Gemini
    if (config.params) {
      config.params.key = activeConfig.apiKey;
    } else {
      config.params = { key: activeConfig.apiKey };
    }
    return config;
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add timestamp to prevent caching
      if (config.params) {
        config.params._t = Date.now();
      } else {
        config.params = { _t: Date.now() };
      }
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject({
        message: 'Request failed',
        details: error.message,
        status: error.response?.status
      });
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Handle successful responses from Gemini
      if (response.data?.candidates) {
        // Gemini response format is already correct
        return response;
      }
      return response;
    },
    (error) => {
      console.error('Gemini API Error:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to connect to Gemini API';
      let errorDetails = error.response?.data?.error || error.message;
      
      // Handle Gemini specific errors
      if (error.response?.status === 403) {
        errorMessage = 'API Key Error';
        errorDetails = 'Please check your Gemini API key configuration';
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please try again later';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
        errorDetails = 'The request took too long. Please try again.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection';
        errorDetails = 'Please check your internet connection and try again.';
      }
      
      return Promise.reject({
        message: errorMessage,
        details: errorDetails,
        status: error.response?.status,
        code: error.code
      });
    }
  );

  return client;
};

// Enhanced system prompt for Google Gemini
const DEFAULT_SYSTEM_PROMPT = `You are an expert AI Coding Assistant powered by Google Gemini, similar to Cursor or GitHub Copilot. Your purpose is to generate complete, functional code based on the user's specifications.

CAPABILITIES:
- Generate clean, well-structured code following best practices
- Write efficient, readable code with proper error handling
- Include comprehensive comments and documentation
- Suggest best practices and optimal solutions
- Help with debugging, refactoring, and optimization
- Support for multiple programming languages and frameworks

OUTPUT FORMAT:
Always respond with code in a code block when providing code solutions:

\`\`\`[language]
// Your code here
// Include comments explaining complex logic
// Add documentation where appropriate
\`\`\`

IMPORTANT:
- Follow language-specific style guides and conventions
- Include proper error handling where needed
- Write clear, descriptive variable and function names
- Include documentation for complex functions and classes
- Make code production-ready and well-documented
- When not providing code, give clear, helpful explanations`;

// Request code generation from Gemini (non-streaming version)
export const generateCode = async (
  prompt: string, 
  modelType: ModelType, 
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT
): Promise<string> => {
  try {
    const client = createApiClient();

    console.log(`Generating code with Google Gemini model: ${AI_MODELS[modelType].name}`);

    const requestData = {
      contents: [
        { 
          role: 'user', 
          parts: [{ 
            text: `${systemPrompt}\n\n${prompt}` 
          }] 
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    };
    
    const response = await client.post(`/models/${AI_MODELS[modelType].id}:generateContent`, requestData);
    
    // Handle Gemini response format
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error: any) {
    console.error('Error generating code:', error);
    
    // If we get here, the error wasn't handled by the interceptor
    const apiError: ApiError = {
      message: 'Failed to generate code',
      details: error.response?.data?.error || error.message || 'Unknown error',
      status: error.response?.status
    };
    
    throw apiError;
  }
};

// Stream code generation from Google Gemini
export const streamGenerateCode = async (
  prompt: string,
  modelType: ModelType = 'gemini',
  systemPrompt: string = '',
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: ApiError) => void
): Promise<void> => {
  if (!modelType || !Object.keys(AI_MODELS).includes(modelType)) {
    console.warn(`Invalid model type: ${modelType}, falling back to gemini`);
    modelType = 'gemini';
  }
  
  const activeConfig = getActiveConfig();
  let fullResponseText = '';
  
  try {
    console.log(`Streaming with Google Gemini model: ${AI_MODELS[modelType].name} (${AI_MODELS[modelType].id})`);

    // Prepare the request data for Google Gemini
    const requestData = {
      contents: [
        { 
          role: 'user', 
          parts: [{ 
            text: `${systemPrompt}\n\n${prompt}` 
          }] 
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    };
    
    // Use fetch API for streaming to Gemini
    const response = await fetch(`${activeConfig.endpoint}/models/${AI_MODELS[modelType].id}:streamGenerateContent?key=${activeConfig.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      console.error('Gemini API Error Response:', errorData);
      
      // Provide more specific error messages
      if (response.status === 404) {
        throw new Error(`Model '${AI_MODELS[modelType].id}' not found. Please check the Gemini API documentation.`);
      } else if (response.status === 400) {
        throw new Error(`Bad request: ${errorMessage}`);
      } else if (response.status === 403) {
        throw new Error(`API key error: ${errorMessage}. Please check your Gemini API key.`);
      }
      
      throw new Error(errorMessage);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    
    // Process the stream chunk by chunk with improved error handling
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;
    
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Reset error counter on successful read
        consecutiveErrors = 0;
        
        // Decode the chunk and add it to our buffer
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue; // Skip empty chunks
        
        buffer += chunk;
        
        // Process complete lines from the buffer
        const lines = buffer.split('\n');
        
        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          // Handle Gemini streaming format (direct JSON)
          if (line.startsWith('{') && line.endsWith('}')) {
            // Handle stream end marker
            if (line.includes('[DONE]')) {
              continue;
            }
            
            // Skip empty JSON strings
            if (!line || line.trim() === '') {
              continue;
            }
            
            try {
              const chunk = JSON.parse(line);
              
              // Handle Gemini response format
              let content = '';
              
              if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
                content = chunk.candidates[0].content.parts[0].text;
              }
              
              if (content) {
                console.log('Streaming content chunk:', content.slice(0, 50) + (content.length > 50 ? '...' : ''));
                fullResponseText += content;
                onChunk(content);
              }
            } catch (e) {
              // Only log parsing errors for non-empty JSON strings
              if (line && line.trim() !== '') {
                console.error('Error parsing JSON from stream:', e, line.substring(0, 100));
                consecutiveErrors++;
                
                // If too many consecutive errors, break the stream
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                  throw new Error('Too many parsing errors in stream');
                }
              }
            }
          }
        }
        
        // Keep the last (potentially incomplete) line for the next iteration
        buffer = lines[lines.length - 1] || '';
      } catch (error) {
        console.error('Error reading from stream:', error);
        consecutiveErrors++;
        
        // If too many consecutive errors, break the stream
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          throw new Error('Stream reading failed after multiple errors');
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Process any remaining content in the buffer
    if (buffer.trim() && buffer.trim().startsWith('data: ')) {
      try {
        const jsonStr = buffer.trim().substring(6);
        if (jsonStr !== '[DONE]') {
          const chunk = JSON.parse(jsonStr) as StreamingResponseChunk;
          let content = '';
          
          if (chunk.message?.content) {
            content = chunk.message.content;
          }
          
          if (content) {
            fullResponseText += content;
            onChunk(content);
          }
        }
      } catch (e) {
        console.error('Error parsing remaining JSON:', e);
      }
    }
    
    // Always log the full response for debugging
    console.log('Final full response length:', fullResponseText.length);
    
    if (fullResponseText && fullResponseText.trim()) {
      // Successfully got a response
      onComplete(fullResponseText);
    } else {
      // No valid response received
      console.error('Empty response received from Gemini API');
      onError({
        message: 'No response content received from AI',
        status: 204,
        details: 'The Gemini service returned an empty response. Please try again.'
      });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // If we get here, the error wasn't handled by the fallback
    onError({
      message: 'Failed to connect to Gemini API',
      details: error.message || String(error),
      status: error.response?.status || 500
    });
  }
};

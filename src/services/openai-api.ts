// OpenAI API Service for AI-Powered Python IDE
// Supports OpenAI and OpenRouter API providers

// ============================================================================
// CONFIGURATION
// ============================================================================

// OpenAI/OpenRouter API Configuration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;
const OPENAI_BASE_URL = process.env.REACT_APP_OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type OpenAIModelType = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet' | 'gemini-2.0-flash';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

export interface OpenAICompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const OPENAI_MODELS = {
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
  },
  'gemini-2.0-flash': {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and reliable model from Google',
    contextLength: 1000000,
    isFree: true,
    provider: 'Google'
  }
};

// ============================================================================
// API CLIENT
// ============================================================================

const createOpenAIClient = () => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set REACT_APP_OPENAI_API_KEY or REACT_APP_OPENROUTER_API_KEY');
  }

  return {
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': process.env.REACT_APP_SITE_URL || 'http://localhost:3001',
      'X-Title': process.env.REACT_APP_SITE_NAME || 'AI Python IDE',
    }
  };
};

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

export const generateCodeWithOpenAI = async (
  prompt: string,
  modelType: OpenAIModelType = 'gpt-4o',
  systemPrompt: string = 'You are an expert Python programmer. Write clean, efficient, and well-documented code.'
): Promise<string> => {
  try {
    const client = createOpenAIClient();
    const model = OPENAI_MODELS[modelType];

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const response = await fetch(`${client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
        ...client.defaultHeaders
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data: OpenAICompletionResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    const apiError: ApiError = {
      message: 'Failed to generate code with OpenAI',
      details: error.message || 'Unknown error',
      status: error.status
    };
    throw apiError;
  }
};

export const streamGenerateCodeWithOpenAI = async (
  prompt: string,
  modelType: OpenAIModelType = 'gpt-4o',
  systemPrompt: string = 'You are an expert Python programmer. Write clean, efficient, and well-documented code.',
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: ApiError) => void
): Promise<void> => {
  let fullResponseText = '';

  try {
    const client = createOpenAIClient();
    const model = OPENAI_MODELS[modelType];

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const response = await fetch(`${client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
        ...client.defaultHeaders
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) continue;

      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.substring(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponseText += content;
              onChunk(content);
            }
          } catch (e) {
            // Ignore parsing errors for malformed chunks
          }
        }
      }
    }

    if (fullResponseText.trim()) {
      onComplete(fullResponseText);
    } else {
      onError({
        message: 'No response content received from OpenAI',
        status: 204,
        details: 'The API returned an empty response. Please try again.'
      });
    }
  } catch (error: any) {
    console.error('OpenAI Streaming Error:', error);
    onError({
      message: 'Failed to connect to OpenAI API',
      details: error.message || 'Unknown error',
      status: error.status || 500
    });
  }
};

export const analyzeImageWithOpenAI = async (
  imageUrl: string,
  question: string,
  modelType: OpenAIModelType = 'gpt-4o'
): Promise<string> => {
  try {
    const client = createOpenAIClient();
    const model = OPENAI_MODELS[modelType];

    // Check if model supports vision
    if (!model.id.includes('gpt-4o') && !model.id.includes('claude')) {
      throw new Error('Selected model does not support image analysis. Please use GPT-4o or Claude models.');
    }

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: question || 'What do you see in this image?'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    const response = await fetch(`${client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
        ...client.defaultHeaders
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data: OpenAICompletionResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('OpenAI Vision API Error:', error);
    const apiError: ApiError = {
      message: 'Failed to analyze image with OpenAI',
      details: error.message || 'Unknown error',
      status: error.status
    };
    throw apiError;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getOpenAIModelInfo = (modelType: OpenAIModelType) => {
  return OPENAI_MODELS[modelType];
};

export const isModelConfigured = () => {
  return !!OPENAI_API_KEY;
};

export const validateOpenAIConfig = () => {
  const errors: string[] = [];
  
  if (!OPENAI_API_KEY) {
    errors.push('OpenAI API key is required. Set REACT_APP_OPENAI_API_KEY or REACT_APP_OPENROUTER_API_KEY');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const openaiApiService = {
  generateCode: generateCodeWithOpenAI,
  streamGenerateCode: streamGenerateCodeWithOpenAI,
  analyzeImage: analyzeImageWithOpenAI,
  models: OPENAI_MODELS,
  validateConfig: validateOpenAIConfig,
  isConfigured: isModelConfigured
};

export default openaiApiService;

// Unified API Service - Supports Multiple AI Providers
// Automatically routes requests to the appropriate API based on model selection

import { streamGenerateCode as geminiStreamGenerate } from './gemini-api';
import { streamGenerateCodeWithOpenAI, generateCodeWithOpenAI } from './openai-api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ModelType = 'gemini' | 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet';

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

export interface StreamingOptions {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: ApiError) => void;
}

// Model configuration - Multiple AI Providers (only working models)
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

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

const isGeminiModel = (modelType: ModelType): modelType is 'gemini' => {
  return modelType === 'gemini';
};

const isOpenAIModel = (modelType: ModelType): modelType is 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet' => {
  return ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet'].includes(modelType);
};

const getProviderForModel = (modelType: ModelType): 'gemini' | 'openai' => {
  if (isGeminiModel(modelType)) return 'gemini';
  if (isOpenAIModel(modelType)) return 'openai';
  throw new Error(`Unknown model type: ${modelType}`);
};

// ============================================================================
// UNIFIED API FUNCTIONS
// ============================================================================

export const generateCode = async (
  prompt: string,
  modelType: ModelType = 'gemini',
  systemPrompt: string = 'You are an expert coding assistant. Provide clear, well-documented code.'
): Promise<string> => {
  try {
    const provider = getProviderForModel(modelType);
    
    if (provider === 'gemini') {
      // For Gemini, we need to import and use the Gemini API
      const { generateCode: geminiGenerate } = await import('./gemini-api');
      return await geminiGenerate(prompt, 'gemini', systemPrompt);
    } else {
      // For OpenAI models, use the OpenAI API
      return await generateCodeWithOpenAI(prompt, modelType as 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet', systemPrompt);
    }
  } catch (error: any) {
    console.error(`Error generating code with ${modelType}:`, error);
    const apiError: ApiError = {
      message: `Failed to generate code using ${AI_MODELS[modelType].name}`,
      details: error.message || 'Unknown error',
      status: error.status
    };
    throw apiError;
  }
};

export const streamGenerateCode = async (
  prompt: string,
  modelType: ModelType = 'gemini',
  systemPrompt: string = 'You are an expert coding assistant. Provide clear, well-documented code.',
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: ApiError) => void
): Promise<void> => {
  try {
    const provider = getProviderForModel(modelType);
    
    if (provider === 'gemini') {
      // Use Gemini API for streaming
      await geminiStreamGenerate(
        prompt,
        'gemini',
        systemPrompt,
        onChunk,
        onComplete,
        onError
      );
    } else {
      // Use OpenAI API for streaming
      await streamGenerateCodeWithOpenAI(
        prompt,
        modelType as 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet',
        systemPrompt,
        onChunk,
        onComplete,
        onError
      );
    }
  } catch (error: any) {
    console.error(`Error streaming code with ${modelType}:`, error);
    const apiError: ApiError = {
      message: `Failed to connect to ${AI_MODELS[modelType].provider} API`,
      details: error.message || 'Unknown error',
      status: error.status || 500
    };
    onError(apiError);
  }
};

// ============================================================================
// MODEL MANAGEMENT
// ============================================================================

export const getAvailableModels = () => {
  return Object.entries(AI_MODELS).map(([key, model]) => ({
    id: key,
    modelId: model.id,
    name: model.name,
    description: model.description,
    contextLength: model.contextLength,
    isFree: model.isFree,
    provider: model.provider
  }));
};

export const getModelsByProvider = (provider: 'google' | 'openai' | 'anthropic' | 'all') => {
  if (provider === 'all') {
    return getAvailableModels();
  }
  
  return getAvailableModels().filter(model => 
    model.provider?.toLowerCase() === provider.toLowerCase()
  );
};

export const getFreeModels = () => {
  return getAvailableModels().filter(model => model.isFree);
};

export const getPremiumModels = () => {
  return getAvailableModels().filter(model => !model.isFree);
};

export const getModelInfo = (modelType: ModelType) => {
  return AI_MODELS[modelType];
};

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

export const validateModelConfiguration = (modelType: ModelType) => {
  const provider = getProviderForModel(modelType);
  const errors: string[] = [];
  
  if (provider === 'gemini') {
    const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!geminiApiKey) {
      errors.push('Gemini API key is required. Set REACT_APP_GEMINI_API_KEY in your .env file');
    }
  } else if (provider === 'openai') {
    const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      errors.push('OpenAI/OpenRouter API key is required. Set REACT_APP_OPENAI_API_KEY or REACT_APP_OPENROUTER_API_KEY in your .env file');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    provider,
    model: AI_MODELS[modelType]
  };
};

export const getConfigurationStatus = () => {
  const geminiConfigured = !!process.env.REACT_APP_GEMINI_API_KEY;
  const openaiConfigured = !!(process.env.REACT_APP_OPENAI_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY);
  
  return {
    gemini: {
      configured: geminiConfigured,
      models: geminiConfigured ? getModelsByProvider('google') : []
    },
    openai: {
      configured: openaiConfigured,
      models: openaiConfigured ? getModelsByProvider('openai') : []
    },
    anthropic: {
      configured: openaiConfigured, // Claude models use OpenAI/OpenRouter
      models: openaiConfigured ? getModelsByProvider('anthropic') : []
    },
    totalModelsConfigured: getAvailableModels().length
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const suggestBestModel = (task: 'simple' | 'complex' | 'analysis' | 'free'): ModelType => {
  switch (task) {
    case 'simple':
      return 'gpt-4o-mini'; // Fast and cost-effective
    case 'complex':
      return 'gpt-4o'; // Most capable available model
    case 'analysis':
      return 'claude-3.5-sonnet'; // Best reasoning
    case 'free':
      return 'gemini'; // Free option
    default:
      return 'gemini'; // Default to free option
  }
};

export const estimateTokenUsage = (prompt: string, modelType: ModelType) => {
  const model = AI_MODELS[modelType];
  // Rough estimation: ~4 characters per token
  const estimatedTokens = Math.ceil(prompt.length / 4);
  
  return {
    input: estimatedTokens,
    maxOutput: model.contextLength - estimatedTokens,
    contextLength: model.contextLength,
    model: model.name
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

const unifiedApiService = {
  generateCode,
  streamGenerateCode,
  getAvailableModels,
  getModelsByProvider,
  getModelInfo,
  validateModelConfiguration,
  getConfigurationStatus,
  suggestBestModel,
  estimateTokenUsage,
  models: AI_MODELS
};

export default unifiedApiService;

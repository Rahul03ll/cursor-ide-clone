// Google Gemini API Service - FREE AI API (No credit card required!)
// Get your free API key from: https://aistudio.google.com/app/apikey

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

// Free Gemini API configuration
// IMPORTANT: Get your FREE API key from: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash'; // Fast and reliable model
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log('🚀 Using Google Gemini API (FREE)');
console.log('📝 Model:', GEMINI_MODEL);
console.log('🔑 API Key:', GEMINI_API_KEY ? '✅ Configured' : '❌ MISSING - Get free key from: https://aistudio.google.com/app/apikey');

// Check if API key is configured
if (!GEMINI_API_KEY) {
  console.error('');
  console.error('⚠️  NO API KEY CONFIGURED!');
  console.error('');
  console.error('To use AI features, you need a FREE Google Gemini API key:');
  console.error('1. Go to: https://aistudio.google.com/app/apikey');
  console.error('2. Click "Create API Key"');
  console.error('3. Copy your key');
  console.error('4. Create a .env file in the project root with:');
  console.error('   REACT_APP_GEMINI_API_KEY=your_key_here');
  console.error('');
  console.error('Or edit src/services/gemini-api.ts line 17');
  console.error('');
}

// Convert messages to Gemini format
const convertMessagesToGemini = (messages: ChatMessage[]) => {
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const contents = userMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  // Prepend system message to first user message if exists
  if (systemMessage && contents.length > 0 && contents[0].role === 'user') {
    contents[0].parts[0].text = `${systemMessage.content}\n\n${contents[0].parts[0].text}`;
  }
  
  return contents;
};

// Stream code generation from Gemini
export const streamGenerateCode = async (
  prompt: string,
  modelType: ModelType = 'gemini',
  systemPrompt: string = 'You are an expert coding assistant. Provide clear, well-documented code.',
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: ApiError) => void
): Promise<void> => {
  let fullResponseText = '';

  try {
    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      throw new Error(
        'No API key configured!\n\n' +
        'Get your FREE Google Gemini API key:\n' +
        '1. Go to: https://aistudio.google.com/app/apikey\n' +
        '2. Click "Create API Key"\n' +
        '3. Copy your key\n' +
        '4. Create .env file with: REACT_APP_GEMINI_API_KEY=your_key\n\n' +
        'Or edit src/services/gemini-api.ts line 17'
      );
    }

    console.log('🤖 Generating code with Gemini...');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const contents = convertMessagesToGemini(messages);

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40
      }
    };

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;

      console.error('❌ Gemini API Error:', errorData);

      if (response.status === 400 || response.status === 403) {
        throw new Error(
          'Invalid or missing API key!\n\n' +
          'Get your FREE Google Gemini API key:\n' +
          '1. Go to: https://aistudio.google.com/app/apikey\n' +
          '2. Click "Create API Key"\n' +
          '3. Copy your key\n' +
          '4. Create .env file with: REACT_APP_GEMINI_API_KEY=your_key\n\n' +
          'Or edit src/services/gemini-api.ts line 17'
        );
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Extract text from Gemini response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            fullResponseText += part.text;
            onChunk(part.text);
          }
        }
      }
    }
    
    if (!fullResponseText) {
      throw new Error('No response from Gemini API');
    }
    
    console.log('✅ Code generation complete');
    onComplete(fullResponseText);
    
  } catch (error: any) {
    console.error('❌ Error generating code:', error);
    
    const apiError: ApiError = {
      message: error.message || 'Failed to generate code',
      details: error.toString(),
      status: error.status
    };
    
    onError(apiError);
  }
};

// Non-streaming version
export const generateCode = async (
  prompt: string,
  modelType: ModelType = 'gemini',
  systemPrompt: string = 'You are an expert coding assistant.'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => { /* Chunk handling done in stream function */ },
      (complete) => { resolve(complete); },
      (error) => { reject(error); }
    );
  });
};

// Export model types - only Gemini models for this API
export type ModelType = 'gemini';

export const AI_MODELS = {
  gemini: {
    id: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash',
    description: 'Fast and reliable free Google AI model for code generation',
    contextLength: 1000000,
    isFree: true
  }
};


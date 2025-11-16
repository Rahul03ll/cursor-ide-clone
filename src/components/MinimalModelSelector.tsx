import React, { useState } from 'react';
import { ModelType, AI_MODELS, validateModelConfiguration, getModelsByProvider } from '../services/unified-api';
import { FaChevronDown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface MinimalModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

const MinimalModelSelector: React.FC<MinimalModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get currently selected model details
  const currentModel = AI_MODELS[selectedModel];
  
  // Validate model configuration
  const modelConfig = validateModelConfiguration(selectedModel);
  
  // Group models by provider
  const googleModels = getModelsByProvider('google');
  const openaiModels = getModelsByProvider('openai');
  const anthropicModels = getModelsByProvider('anthropic');
  
  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'google':
        return '🔮';
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      default:
        return '🤖';
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#252526] hover:bg-[#2d2d2d] text-[#cccccc] px-3 py-1.5 rounded-sm border border-[#3e3e42] text-sm"
      >
        <span className="text-sm">{getProviderIcon(currentModel.provider)}</span>
        <span>{currentModel.name}</span>
        <FaChevronDown size={10} />
        {!modelConfig.isValid && (
          <FaExclamationTriangle className="text-yellow-500" size={10} />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#3e3e42] rounded-sm shadow-lg z-10 w-80">
          <div className="p-2 border-b border-[#3e3e42]">
            <h4 className="text-xs uppercase text-[#8f8f8f]">Select AI Model</h4>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {/* Google Models */}
            {googleModels.length > 0 && (
              <div className="border-b border-[#3e3e42]">
                <div className="px-2 py-1 bg-[#2d2d2d]">
                  <span className="text-xs font-semibold text-[#cccccc]">🔮 Google</span>
                </div>
                {googleModels.map((model) => {
                  const config = validateModelConfiguration(model.id as ModelType);
                  return (
                    <div 
                      key={model.id}
                      className={`p-2 flex flex-col hover:bg-[#2d2d2d] cursor-pointer ${
                        model.id === selectedModel ? 'bg-[#37373d]' : ''
                      }`}
                      onClick={() => {
                        onModelChange(model.id as ModelType);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2">{getProviderIcon(model.provider)}</span>
                          <span className="font-medium text-[#cccccc]">{model.name}</span>
                          {model.isFree && (
                            <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">FREE</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {model.id === selectedModel && (
                            <FaCheckCircle className="text-green-500 mr-1" size={12} />
                          )}
                          {!config.isValid && (
                            <FaExclamationTriangle className="text-yellow-500" size={12} />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-[#8f8f8f] mt-1 ml-6">
                        {model.description}
                      </div>
                      <div className="text-xs text-[#8f8f8f] mt-1 ml-6">
                        Context: {(model.contextLength / 1000).toFixed(0)}K tokens
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* OpenAI Models */}
            {openaiModels.length > 0 && (
              <div className="border-b border-[#3e3e42]">
                <div className="px-2 py-1 bg-[#2d2d2d]">
                  <span className="text-xs font-semibold text-[#cccccc]">🤖 OpenAI</span>
                </div>
                {openaiModels.map((model) => {
                  const config = validateModelConfiguration(model.id as ModelType);
                  return (
                    <div 
                      key={model.id}
                      className={`p-2 flex flex-col hover:bg-[#2d2d2d] cursor-pointer ${
                        model.id === selectedModel ? 'bg-[#37373d]' : ''
                      }`}
                      onClick={() => {
                        onModelChange(model.id as ModelType);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2">{getProviderIcon(model.provider)}</span>
                          <span className="font-medium text-[#cccccc]">{model.name}</span>
                          {!model.isFree && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Premium</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {model.id === selectedModel && (
                            <FaCheckCircle className="text-green-500 mr-1" size={12} />
                          )}
                          {!config.isValid && (
                            <FaExclamationTriangle className="text-yellow-500" size={12} />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-[#8f8f8f] mt-1 ml-6">
                        {model.description}
                      </div>
                      <div className="text-xs text-[#8f8f8f] mt-1 ml-6">
                        Context: {(model.contextLength / 1000).toFixed(0)}K tokens
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Anthropic Models */}
            {anthropicModels.length > 0 && (
              <div>
                <div className="px-2 py-1 bg-[#2d2d2d]">
                  <span className="text-xs font-semibold text-[#cccccc]">🧠 Anthropic</span>
                </div>
                {anthropicModels.map((model) => {
                  const config = validateModelConfiguration(model.id as ModelType);
                  return (
                    <div 
                      key={model.id}
                      className={`p-2 flex flex-col hover:bg-[#2d2d2d] cursor-pointer ${
                        model.id === selectedModel ? 'bg-[#37373d]' : ''
                      }`}
                      onClick={() => {
                        onModelChange(model.id as ModelType);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2">{getProviderIcon(model.provider)}</span>
                          <span className="font-medium text-[#cccccc]">{model.name}</span>
                          {!model.isFree && (
                            <span className="ml-2 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded">Premium</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {model.id === selectedModel && (
                            <FaCheckCircle className="text-green-500 mr-1" size={12} />
                          )}
                          {!config.isValid && (
                            <FaExclamationTriangle className="text-yellow-500" size={12} />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-[#8f8f8f] mt-1 ml-6">
                        {model.description}
                      </div>
                      <div className="text-xs text-[#8f8f8f] mt-1 ml-6">
                        Context: {(model.contextLength / 1000).toFixed(0)}K tokens
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Configuration Help */}
          <div className="p-2 border-t border-[#3e3e42] bg-[#2d2d2d]">
            <div className="text-xs text-[#8f8f8f]">
              <div>💡 Configure API keys in .env file</div>
              <div>🔮 Gemini: FREE • 🤖 OpenAI: Premium • 🧠 Claude: Premium</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalModelSelector;

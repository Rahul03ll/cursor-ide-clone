import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaTimes, FaCopy, FaCheckCircle, FaRobot, FaTrash, FaSearch, FaCheck } from 'react-icons/fa';
import { ModelType } from '../services/unified-api';
import { askAboutCode, searchProjectContext, ProjectContext } from '../services/aiFeatures';
import { useProject } from '../context/ProjectContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: string[];
}

interface EnhancedChatPanelProps {
  onClose: () => void;
  currentFile?: any;
  currentFileContent?: string;
  modelType: ModelType;
  language: string;
}

const EnhancedChatPanel: React.FC<EnhancedChatPanelProps> = ({
  onClose,
  currentFile,
  currentFileContent,
  modelType,
  language
}) => {
  const { files } = useProject();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `🤖 **Cursor-AI Assistant Ready!**\n\nI'm here to help you with your coding questions and tasks.\n\n**🔧 Available AI Features:**\n• **Explain Code** - Get detailed explanations (use toolbar button)\n• **Auto Comment** - Generate documentation (use toolbar button)\n• **Chat with Context** - Ask questions about your entire project\n• **Code Analysis** - Debug, refactor, and optimize your code\n\n**Available AI Models:**\n• 🔮 **Gemini 2.0 Flash** (Free - 1M tokens)\n• 🤖 **GPT-4o** (Premium OpenAI model)\n• ⚡ **GPT-4o Mini** (Fast and efficient)\n• 🧠 **Claude 3.5 Sonnet** (Advanced reasoning)\n\n**How to use:**\n1. Select code in the editor for better context\n2. Use the "Explain Code" or "Auto Comment" buttons in the editor toolbar\n3. Type your questions here for chat-based assistance\n\nReady to help you code smarter! 🚀`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useProjectContext, setUseProjectContext] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build project context
  const buildProjectContext = (): ProjectContext => {
    return {
      files: files.map(file => ({
        path: file.name,
        content: file.content || '',
        language: file.extension || 'text'
      })),
      currentFile: currentFile?.name
    };
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let contextFiles: string[] = [];
      let codeContext = currentFileContent || '';

      // Search for relevant files if using project context
      if (useProjectContext) {
        const projectContext = buildProjectContext();
        const relevantFiles = searchProjectContext(inputValue, projectContext);
        
        // Use top 3 most relevant files
        contextFiles = relevantFiles.slice(0, 3).map(f => f.path);
        
        // Add relevant file contents to context
        if (relevantFiles.length > 0) {
          codeContext = relevantFiles
            .slice(0, 3)
            .map(f => `// File: ${f.path}\n${f.content}`)
            .join('\n\n');
        }
      }

      // Get AI response
      const response = await askAboutCode(
        inputValue,
        codeContext,
        language,
        modelType,
        useProjectContext ? buildProjectContext() : undefined
      );

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        context: contextFiles
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Error:', error);
      
      const errorMessage = error?.message || 'Failed to get AI response';
      const errorDetails = error?.details || '';
      
      const errorResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **AI Error**: ${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}\n\n💡 **Need help?**\n• Get a free Gemini API key: https://aistudio.google.com/app/apikey\n• Get OpenAI/OpenRouter key: https://openrouter.ai/keys\n• Check our setup guide in the README`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard with enhanced feedback
  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setToastMessage('Code copied to clipboard!');
      setShowToast(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      setToastMessage('Failed to copy code');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Clear all chat messages? This will start a fresh conversation.')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `🤖 **Fresh Start!**\n\nChat history cleared. I'm ready to help you with:\n\n💻 Code questions • 🔧 Bug fixes • 📝 Code generation • 📚 Explanations\n\nWhat would you like to work on?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  // Render code blocks with enhanced formatting
  const renderMessage = (message: Message) => {
    const parts = message.content.split(/(```[\s\S]*?```)/g);
    
    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (part.startsWith('```')) {
            const match = part.match(/```(\w+)?\n?([\s\S]*?)\n?```/);
            if (match) {
              const lang = match[1] || 'code';
              const code = match[2].trim();
              const copyId = `${message.id}-code-${index}`;
              
              return (
                <div key={index} className="relative my-4 rounded-lg overflow-hidden border border-[#3e3e42] bg-[#1e1e1e]">
                  {/* Code header with language and copy button */}
                  <div className="flex justify-between items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e42]">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-[#8f8f8f] uppercase">{lang}</span>
                      <span className="text-xs text-[#6e6e6e]">•</span>
                      <span className="text-xs text-[#6e6e6e]">{code.split('\n').length} lines</span>
                    </div>
                    <button
                      onClick={() => handleCopy(copyId, code)}
                      className="flex items-center space-x-1 text-xs text-[#8f8f8f] hover:text-white px-2 py-1 rounded hover:bg-[#3e3e42] transition-colors"
                      title="Copy code"
                    >
                      {copiedId === copyId ? (
                        <>
                          <FaCheckCircle className="text-green-500" />
                          <span className="text-green-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FaCopy />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Code content with better formatting */}
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-[#d4d4d4] text-sm font-mono leading-relaxed">
                      <code className="whitespace-pre">{code}</code>
                    </pre>
                  </div>
                </div>
              );
            }
          }
          
          return part ? (
            <div key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
              {part}
            </div>
          ) : null;
        })}
        
        {/* Show context files if available */}
        {message.context && message.context.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <FaSearch />
            <span>Context: {message.context.join(', ')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e3e42] bg-[#2d2d30]">
        <div className="flex items-center gap-2">
          <FaRobot className="text-blue-400" />
          <h3 className="font-semibold">AI Assistant</h3>
          {currentFile && (
            <span className="text-xs text-gray-400">• {currentFile.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-[#3e3e42] rounded transition-colors"
            title="Clear chat"
          >
            <FaTrash className="text-sm" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3e3e42] rounded transition-colors"
            title="Close chat"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="px-4 py-2 border-b border-[#3e3e42] bg-[#252526]">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={useProjectContext}
            onChange={(e) => setUseProjectContext(e.target.checked)}
            className="rounded"
          />
          <span>Search project files for context</span>
        </label>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2d2d30] border border-[#3e3e42]'
              }`}
            >
              {renderMessage(message)}
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-[#3e3e42] p-4 bg-[#252526]">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me anything about your code... (Shift+Enter for new line)"
            className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
          <FaCheck className="text-green-400" />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatPanel;

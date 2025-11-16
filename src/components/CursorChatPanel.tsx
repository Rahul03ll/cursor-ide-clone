import React, { useState, useRef, useEffect } from "react";
import {
  FaPaperPlane,
  FaTimes,
  FaCopy,
  FaCheckCircle,
  FaRobot,
  FaTrash,
} from "react-icons/fa";
import { ModelType } from "../services/unified-api";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface CodeBlockProps {
  messageId: string;
  index: number;
  language: string;
  content: string;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(({ messageId, index, language, content, copiedId, onCopy }) => {
  const copyId = `${messageId}-code-${index}`;
  return (
    <div className="relative mt-2 mb-2 rounded bg-[#1e1e1e] p-2 border border-[#3e3e42]">
      <div className="flex justify-between items-center mb-1 text-xs">
        <div className="text-[#8f8f8f]">{language || "code"}</div>
        <button
          onClick={() => onCopy(copyId, content)}
          className="text-[#8f8f8f] hover:text-white px-1"
          title="Copy code"
        >
          {copiedId === copyId ? (
            <FaCheckCircle className="text-green-500" />
          ) : (
            <FaCopy />
          )}
        </button>
      </div>
      <pre className="text-[#d4d4d4] overflow-x-auto">
        <code>{content}</code>
      </pre>
    </div>
  );
});

interface SlashCommand {
  command: string;
  description: string;
  example: string;
}

interface CursorChatPanelProps {
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<string>;
  currentFile?: any;
  isLoading?: boolean;
  currentFileContent?: string;
  modelType: ModelType;
}

const CursorChatPanel: React.FC<CursorChatPanelProps> = ({
  onClose,
  onSubmit,
  currentFile,
  isLoading = false,
  currentFileContent,
  modelType,
}) => {
  // Message history limit to prevent memory issues
  const MAX_MESSAGES = 100;

  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem("chat-messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }

    return [
      {
        id: "welcome",
        role: "assistant" as const,
        content: "Hello! I'm your coding assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ];
  });

  // Save messages to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("chat-messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving chat history:", e);
    }
  }, [messages]);

  // Limit message history to prevent memory issues
  const addMessage = (message: Message) => {
    setMessages((prev) => {
      const updated = [...prev, message];
      // Keep only the last MAX_MESSAGES messages
      return updated.length > MAX_MESSAGES
        ? updated.slice(-MAX_MESSAGES)
        : updated;
    });
  };

  // Clear chat history
  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all chat history?")) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your coding assistant. How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      try {
        localStorage.removeItem("chat-messages");
      } catch (e) {
        console.error("Error clearing chat history:", e);
      }
    }
  };

  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSlashCommands, setShowSlashCommands] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const slashCommands: SlashCommand[] = [
    {
      command: "/create",
      description: "Create a new file with the specified name and content",
      example: "/create login.html for a signup form",
    },
    {
      command: "/edit",
      description: "Edit an existing file",
      example: "/edit index.js to fix the API call",
    },
    {
      command: "/delete",
      description: "Delete a specified file",
      example: "/delete temp.css",
    },
    {
      command: "/generate",
      description: "Generate new code based on a description",
      example: "/generate a react component for user authentication",
    },
    {
      command: "/explain",
      description: "Explain the selected code or current file",
      example: "/explain this code",
    },
    {
      command: "/refactor",
      description: "Refactor the selected code or current file",
      example: "/refactor to use async/await",
    },
    {
      command: "/test",
      description: "Generate tests for the selected code or current file",
      example: "/test create unit tests for this function",
    },
    {
      command: "/fix",
      description: "Fix issues in the selected code or current file",
      example: "/fix the bugs in this code",
    },
    {
      command: "/optimize",
      description: "Optimize the selected code or current file for performance",
      example: "/optimize this query",
    },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Show slash commands when typing '/'
    if (value === "/") {
      setShowSlashCommands(true);
    } else if (value.startsWith("/")) {
      setShowSlashCommands(true);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setIsProcessing(true);
    setInputValue("");
    setShowSlashCommands(false);

    try {
      // Special handling for code generation
      let prompt = inputValue;

      // Add context about current file if relevant
      if (currentFile && currentFileContent) {
        // For commands that would benefit from file context
        if (
          inputValue.startsWith("/explain") ||
          inputValue.startsWith("/refactor") ||
          inputValue.startsWith("/fix") ||
          inputValue.startsWith("/optimize") ||
          inputValue.startsWith("/test")
        ) {
          prompt += `\n\nCurrent file (${currentFile.name}):\n\`\`\`\n${currentFileContent}\n\`\`\``;
        }
      }

      console.log("Submitting prompt to AI:", prompt);

      // Get AI response
      const response = await onSubmit(prompt);
      console.log("Received AI response:", response);

      if (!response) {
        throw new Error("No response received from AI");
      }

      // Add AI response to messages
      const aiMessage: Message = {
        id: `response-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      addMessage(aiMessage);

      // Extract and apply code if the response contains code blocks and a code modification command was used
      if (
        response.includes("```") &&
        (inputValue.startsWith("/create") ||
          inputValue.startsWith("/edit") ||
          inputValue.startsWith("/fix") ||
          inputValue.startsWith("/refactor"))
      ) {
        console.log("Code block detected in response, would apply code here");
        // Here we would extract and apply the code in a real implementation
        // This simulation just logs that we detected code to apply
      }
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Extract detailed error information for Gemini API
      let errorMessage = "Unknown error";
      let errorDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle ApiError type
        const apiError = error as any;
        errorMessage = apiError.message || "Unknown error";
        errorDetails = apiError.details || "";
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Add error message with Gemini-specific details
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ""}\n\nPlease check:\n- Your Gemini API key is configured correctly\n- You have a working internet connection\n- The API key is valid and not expired`,
        timestamp: new Date(),
      };

      addMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = (id: string, content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  };

  const handleSelectSlashCommand = (command: string) => {
    setInputValue(command + " ");
    setShowSlashCommands(false);
    inputRef.current?.focus();
  };

  const renderMessageContent = (message: Message) => {
    // Handle code blocks
    if (message.content.includes("```")) {
      const parts = message.content.split(/```([\w]*)\n/);
      const elements: JSX.Element[] = [];
      let inCodeBlock = false;
      let language = "";
      let codeContent = "";
      let remainingContent = "";

      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // Text content
          if (parts[i].trim()) {
            if (inCodeBlock) {
              // End of code block
              inCodeBlock = false;
              elements.push(
                <CodeBlock
                  key={`code-${i}`}
                  messageId={message.id}
                  index={i}
                  language={language}
                  content={codeContent}
                  copiedId={copiedId}
                  onCopy={handleCopyToClipboard}
                />,
              );
              codeContent = "";
            }

            remainingContent += parts[i];
          }
        } else {
          // Language or code content
          if (!inCodeBlock) {
            // Start of code block, this part is the language
            language = parts[i];
            inCodeBlock = true;
          } else {
            // Code content
            codeContent = parts[i];
            inCodeBlock = false;
            elements.push(
              <CodeBlock
                key={`code-${i}`}
                messageId={message.id}
                index={i}
                language={language}
                content={codeContent}
                copiedId={copiedId}
                onCopy={handleCopyToClipboard}
              />,
            );

            if (remainingContent) {
              elements.push(
                <p key={`text-${i}`} className="whitespace-pre-wrap">
                  {remainingContent}
                </p>,
              );
              remainingContent = "";
            }
          }
        }
      }

      // Add any remaining text
      if (remainingContent) {
        elements.push(
          <p key="text-final" className="whitespace-pre-wrap">
            {remainingContent}
          </p>,
        );
      }

      return <>{elements}</>;
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] border-t border-[#3e3e42] cursor-chat-container">
      <div className="flex justify-between items-center p-2 border-b border-[#3e3e42]">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white mr-2"
            title="Close panel"
          >
            <FaTimes />
          </button>
          <FaRobot className="text-[#89d185] mr-2" />
          <h3 className="font-medium">AI Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#3e3e42] transition-colors flex items-center gap-1"
            title="Clear chat history"
            disabled={messages.length <= 1}
          >
            <FaTrash className="text-xs" />
            Clear
          </button>
          <div className="text-xs text-gray-400">
            Try: "/create", "/edit file.js", "/delete file.css"...
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-[#0e639c] text-white"
                  : "bg-[#2d2d2d] text-[#cccccc]"
              }`}
            >
              {renderMessageContent(message)}
              <div className="text-xs opacity-70 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-[#2d2d2d] text-[#cccccc]">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">⣾</div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#3e3e42] relative">
        {showSlashCommands && (
          <div className="absolute bottom-full left-0 bg-[#252526] border border-[#3e3e42] rounded shadow-lg z-10 w-full max-h-60 overflow-y-auto">
            {slashCommands
              .filter((cmd) => cmd.command.startsWith(inputValue))
              .map((cmd) => (
                <div
                  key={cmd.command}
                  className="p-2 hover:bg-[#2a2d2e] cursor-pointer"
                  onClick={() => handleSelectSlashCommand(cmd.command)}
                >
                  <div className="font-medium">{cmd.command}</div>
                  <div className="text-xs text-[#8f8f8f]">
                    {cmd.description}
                  </div>
                  <div className="text-xs text-[#8f8f8f] italic">
                    Example: {cmd.example}
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about coding..."
            className="flex-grow bg-[#252526] border border-[#3e3e42] rounded p-2 resize-none outline-none focus:border-[#007acc] text-[#cccccc]"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing || isLoading}
            className={`p-2 rounded-full ${
              !inputValue.trim() || isProcessing || isLoading
                ? "bg-[#3e3e42] text-[#8f8f8f]"
                : "bg-[#0e639c] hover:bg-[#1177bb] text-white"
            }`}
          >
            <FaPaperPlane />
          </button>
        </div>

        <div className="text-xs text-[#8f8f8f] mt-2">
          Type <span className="bg-[#3e3e42] px-1 rounded">/</span> for commands
        </div>
      </div>
    </div>
  );
};

export default CursorChatPanel;

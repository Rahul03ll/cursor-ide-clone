import React, { useState, useEffect, useRef } from "react";
import LoadingAnimation from "./LoadingAnimation";
import {
  FaPlay,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCopy,
} from "react-icons/fa";
import { executePython } from "../services/pythonService";

interface PythonPreviewProps {
  code: string;
}

interface ExecutionResult {
  output: string;
  error: string | null;
  executionTime: number;
}

const PythonPreview: React.FC<PythonPreviewProps> = ({ code }) => {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result]);

  // Format Python traceback for better readability
  const formatPythonError = (error: string): string => {
    if (!error) return error;

    // Check if it's a Python traceback
    if (
      error.includes("Traceback") ||
      error.includes("File") ||
      error.includes("line")
    ) {
      // Add line numbers and formatting
      const lines = error.split("\n");
      return lines
        .map((line, index) => {
          // Highlight error lines
          if (line.includes("Error:") || line.includes("Exception:")) {
            return `\n❌ ${line}`;
          }
          // Format file paths
          if (line.includes('File "') || line.includes("File '")) {
            return `  📁 ${line}`;
          }
          // Format line numbers
          if (line.match(/^\s+line \d+/)) {
            return `  📍 ${line.trim()}`;
          }
          return line;
        })
        .join("\n");
    }

    return error;
  };

  // Copy output to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  // Validate Python code before execution
  const validatePythonCode = (
    code: string,
  ): { valid: boolean; error?: string } => {
    if (!code || code.trim() === "") {
      return { valid: false, error: "No code to execute" };
    }

    if (code.length > 100000) {
      return { valid: false, error: "Code exceeds maximum length (100KB)" };
    }

    // Check for potentially dangerous operations (optional - can be disabled for advanced users)
    const dangerousPatterns = [
      /__import__\s*\(/,
      /eval\s*\(/,
      /exec\s*\(/,
      /open\s*\([^)]*['"]w/,
      /subprocess/,
      /os\.system/,
    ];

    // Only warn, don't block - allow users to run code but show warning
    const hasDangerousOps = dangerousPatterns.some((pattern) =>
      pattern.test(code),
    );

    return {
      valid: true,
      error: hasDangerousOps
        ? "Warning: Code contains potentially unsafe operations"
        : undefined,
    };
  };

  const executePythonCode = async () => {
    // Validate code first
    const validation = validatePythonCode(code);
    if (!validation.valid) {
      setResult({
        output: "",
        error: validation.error || "Invalid code",
        executionTime: 0,
      });
      return;
    }

    setIsExecuting(true);
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Use the pythonService which handles Electron detection
      const result = await executePython(code);

      setResult({
        output: result.output || "",
        error: result.error || (validation.error ? validation.error : null),
        executionTime: result.executionTime || 0,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setResult({
        output: "",
        error: error instanceof Error ? error.message : "Execution failed",
        executionTime,
      });
    } finally {
      setIsExecuting(false);
      setIsLoading(false);
    }
  };

  const clearOutput = () => {
    setResult(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="text-sm font-medium p-2 border-b border-[#3e3e42] bg-[#252526] flex justify-between items-center">
        <span className="flex items-center">
          <FaPlay className="mr-2 text-[#4ec9b0]" />
          Python Output
        </span>
        <div className="flex gap-2">
          <button
            onClick={clearOutput}
            className="text-xs px-2 py-1 bg-[#3e3e42] text-white rounded hover:bg-[#4e4e52] transition-colors"
            disabled={isExecuting || !result}
          >
            Clear
          </button>
          <button
            onClick={executePythonCode}
            className="text-xs px-3 py-1 bg-[#0e639c] text-white rounded hover:bg-[#1177bb] transition-colors flex items-center"
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <FaPlay className="mr-1" />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div
        className="flex-grow overflow-auto p-4 font-mono text-sm"
        ref={outputRef}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <LoadingAnimation text="Executing Python code..." />
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-4">
            {/* Execution Status */}
            <div className="flex items-center justify-between text-xs text-[#858585] pb-2 border-b border-[#3e3e42]">
              <div className="flex items-center gap-4">
                {result.error ? (
                  <span className="flex items-center text-red-400">
                    <FaExclamationTriangle className="mr-1" />
                    Execution Failed
                  </span>
                ) : (
                  <span className="flex items-center text-green-400">
                    <FaCheckCircle className="mr-1" />
                    Execution Complete
                  </span>
                )}
                <span>Execution time: {result.executionTime}ms</span>
              </div>
            </div>

            {/* Error Output */}
            {result.error && (
              <div className="bg-red-900/20 border border-red-700 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-red-400 font-semibold">Error:</div>
                  <button
                    onClick={() => copyToClipboard(result.error || "")}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition-colors flex items-center gap-1"
                    title="Copy error"
                  >
                    {copied ? (
                      <FaCheckCircle className="text-green-400" />
                    ) : (
                      <FaCopy />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="text-red-300 whitespace-pre-wrap break-words font-mono text-xs">
                  {formatPythonError(result.error)}
                </pre>
              </div>
            )}

            {/* Standard Output */}
            {result.output && (
              <div className="bg-[#252526] border border-[#3e3e42] rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[#4ec9b0] font-semibold">Output:</div>
                  <button
                    onClick={() => copyToClipboard(result.output || "")}
                    className="text-[#4ec9b0] hover:text-[#5ed9c0] text-xs px-2 py-1 rounded hover:bg-[#3e3e42] transition-colors flex items-center gap-1"
                    title="Copy output"
                  >
                    {copied ? (
                      <FaCheckCircle className="text-green-400" />
                    ) : (
                      <FaCopy />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="text-[#d4d4d4] whitespace-pre-wrap break-words font-mono text-xs">
                  {result.output}
                </pre>
              </div>
            )}

            {/* Help Text */}
            {!result.error &&
              result.output &&
              result.output.includes("desktop application") && (
                <div className="text-xs text-[#858585] mt-4 p-3 bg-[#252526] rounded border border-[#3e3e42]">
                  <strong>Note:</strong> Python execution requires the Electron
                  desktop application. Run{" "}
                  <code className="text-[#4ec9b0]">npm run dev</code> to launch
                  the desktop app.
                </div>
              )}
            {!result.error &&
              result.output &&
              !result.output.includes("desktop application") && (
                <div className="text-xs text-[#858585] mt-4 p-3 bg-[#252526] rounded border border-[#3e3e42]">
                  <strong>Tip:</strong> Make sure Python 3.8+ is installed on
                  your system and available in your PATH.
                </div>
              )}
          </div>
        )}

        {!isLoading && !result && (
          <div className="flex flex-col items-center justify-center h-full text-[#858585]">
            <FaPlay className="text-4xl mb-4 text-[#4ec9b0]" />
            <p className="text-center max-w-md">
              Click the <strong className="text-white">Run</strong> button to
              execute your Python code.
              <br />
              The output will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PythonPreview;

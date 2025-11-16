import React, { useState, useCallback } from 'react';
import {
  FaBug,
  FaRecycle,
  FaFlask,
  FaQuestionCircle,
  FaFileCode,
  FaChevronDown
} from 'react-icons/fa';
import { ModelType } from '../services/gemini-api';
import InputDialog from './InputDialog';
import {
  fixErrorAutomatically,
  refactorCode,
  generateUnitTests,
  generateDocumentation,
  CodeSelection,
  ErrorContext,
  RefactorOptions,
  TestGenerationOptions
} from '../services/aiFeatures';

interface AIToolbarProps {
  editorRef: React.RefObject<any>;
  modelType: ModelType;
  language: string;
  onShowResult: (title: string, content: string) => void;
  onApplyCode?: (code: string, startLine?: number, endLine?: number) => void;
}

const AIToolbar: React.FC<AIToolbarProps> = ({
  editorRef,
  modelType,
  language,
  onShowResult,
  onApplyCode
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefactorMenu, setShowRefactorMenu] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  // Get current selection
  const getSelection = useCallback((): CodeSelection | null => {
    if (!editorRef.current) return null;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model || selection.isEmpty()) return null;

    return {
      code: model.getValueInRange(selection),
      startLine: selection.startLineNumber,
      endLine: selection.endLineNumber,
      startColumn: selection.startColumn,
      endColumn: selection.endColumn
    };
  }, [editorRef]);

  // Get all code if no selection
  const getCodeContext = useCallback((): string => {
    if (!editorRef.current) return '';
    const selection = getSelection();
    if (selection) return selection.code;
    return editorRef.current.getValue();
  }, [editorRef, getSelection]);

  // Explain Code
  const handleExplain = useCallback(async () => {
    const code = getCodeContext();
    if (!code) {
      onShowResult('Error', 'No code to explain');
      return;
    }

    setIsProcessing(true);
    try {
      const { explainCode } = await import('../services/aiFeatures');
      const explanation = await explainCode(code, language, modelType, 'detailed');
      onShowResult('Code Explanation', explanation);
    } catch (error: any) {
      onShowResult('Error', error.message || 'Failed to explain code');
    } finally {
      setIsProcessing(false);
    }
  }, [getCodeContext, language, modelType, onShowResult]);

  // Fix Errors
  const handleFixErrors = useCallback(async () => {
    const code = getCodeContext();
    if (!code) {
      onShowResult('Error', 'No code selected');
      return;
    }

    setShowErrorDialog(true);
  }, [getCodeContext]);

  const handleErrorDialogConfirm = useCallback(async (errorMessage: string) => {
    if (!errorMessage.trim()) return;
    
    const code = getCodeContext();
    if (!code) return;

    setIsProcessing(true);
    try {
      const errorContext: ErrorContext = {
        errorMessage,
        code,
        language
      };

      const patch = await fixErrorAutomatically(errorContext, modelType);
      
      if (onApplyCode) {
        onApplyCode(patch.modified, patch.startLine, patch.endLine);
      }
      
      onShowResult('Error Fixed', `Fixed: ${errorMessage}\n\nApplied changes to code.`);
    } catch (error: any) {
      onShowResult('Error', error.message || 'Failed to fix error');
    } finally {
      setIsProcessing(false);
    }
  }, [getCodeContext, language, modelType, onShowResult, onApplyCode]);

  // Refactor Code
  const handleRefactor = useCallback(async (type: RefactorOptions['type']) => {
    const code = getCodeContext();
    if (!code) {
      onShowResult('Error', 'No code selected');
      return;
    }

    if (type === 'rename') {
      setShowRenameDialog(true);
      // Store the refactor action for later use when dialog is confirmed
      performRefactor(type, code);
    } else {
      performRefactor(type, code);
    }
  }, [getCodeContext]);

  const performRefactor = useCallback(async (type: RefactorOptions['type'], code: string, target?: string) => {
    setIsProcessing(true);
    setShowRefactorMenu(false);

    try {
      const options: RefactorOptions = {
        type,
        preserveComments: true,
        preserveFormatting: true
      };

      if (type === 'rename' && target) {
        options.target = target;
      }

      const patch = await refactorCode(code, language, options, modelType);
      
      if (onApplyCode) {
        onApplyCode(patch.modified, patch.startLine, patch.endLine);
      }
      
      onShowResult('Code Refactored', `${patch.description}\n\nApplied changes to code.`);
    } catch (error: any) {
      onShowResult('Error', error.message || 'Failed to refactor code');
    } finally {
      setIsProcessing(false);
    }
  }, [language, modelType, onShowResult, onApplyCode]);

  const handleRenameDialogConfirm = useCallback((target: string) => {
    if (!target.trim()) return;
    
    const code = getCodeContext();
    if (!code) return;
    
    performRefactor('rename', code, target);
  }, [getCodeContext, performRefactor]);

  // Generate Tests
  const handleGenerateTests = useCallback(async () => {
    const code = getCodeContext();
    if (!code) {
      onShowResult('Error', 'No code selected');
      return;
    }

    setIsProcessing(true);
    try {
      const options: TestGenerationOptions = {
        framework: 'auto',
        includeEdgeCases: true,
        includeMocks: true,
        coverage: 'comprehensive'
      };

      const tests = await generateUnitTests(code, language, options, modelType);
      onShowResult('Generated Tests', tests);
    } catch (error: any) {
      onShowResult('Error', error.message || 'Failed to generate tests');
    } finally {
      setIsProcessing(false);
    }
  }, [getCodeContext, language, modelType, onShowResult]);

  // Generate Documentation
  const handleGenerateDocs = useCallback(async () => {
    const code = getCodeContext();
    if (!code) {
      onShowResult('Error', 'No code selected');
      return;
    }

    setIsProcessing(true);
    try {
      const documentedCode = await generateDocumentation(code, language, modelType, 'both');
      
      if (onApplyCode) {
        const selection = getSelection();
        onApplyCode(documentedCode, selection?.startLine, selection?.endLine);
      }
      
      onShowResult('Documentation Added', 'Documentation has been added to your code.');
    } catch (error: any) {
      onShowResult('Error', error.message || 'Failed to generate documentation');
    } finally {
      setIsProcessing(false);
    }
  }, [getCodeContext, language, modelType, onShowResult, onApplyCode, getSelection]);

  return (
    <div className="flex items-center gap-2 p-2 bg-[#2d2d30] border-b border-[#3e3e42]">
      {/* Explain Code */}
      <button
        onClick={handleExplain}
        disabled={isProcessing}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Explain selected code or entire file"
      >
        <FaQuestionCircle />
        <span>Explain</span>
      </button>

      {/* Fix Errors */}
      <button
        onClick={handleFixErrors}
        disabled={isProcessing}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Fix errors in selected code"
      >
        <FaBug />
        <span>Fix Error</span>
      </button>

      {/* Refactor Menu */}
      <div className="relative">
        <button
          onClick={() => setShowRefactorMenu(!showRefactorMenu)}
          disabled={isProcessing}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refactor code"
        >
          <FaRecycle />
          <span>Refactor</span>
          <FaChevronDown className="text-xs" />
        </button>

        {showRefactorMenu && (
          <div className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#3e3e42] rounded shadow-lg z-10 min-w-[200px]">
            <button
              onClick={() => handleRefactor('general')}
              className="w-full text-left px-4 py-2 hover:bg-[#2a2d2e] text-sm"
            >
              General Refactor
            </button>
            <button
              onClick={() => handleRefactor('rename')}
              className="w-full text-left px-4 py-2 hover:bg-[#2a2d2e] text-sm"
            >
              Rename Variable
            </button>
            <button
              onClick={() => handleRefactor('extract-method')}
              className="w-full text-left px-4 py-2 hover:bg-[#2a2d2e] text-sm"
            >
              Extract Method
            </button>
            <button
              onClick={() => handleRefactor('extract-variable')}
              className="w-full text-left px-4 py-2 hover:bg-[#2a2d2e] text-sm"
            >
              Extract Variable
            </button>
            <button
              onClick={() => handleRefactor('optimize')}
              className="w-full text-left px-4 py-2 hover:bg-[#2a2d2e] text-sm"
            >
              Optimize Code
            </button>
          </div>
        )}
      </div>

      {/* Generate Tests */}
      <button
        onClick={handleGenerateTests}
        disabled={isProcessing}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate unit tests"
      >
        <FaFlask />
        <span>Generate Tests</span>
      </button>

      {/* Generate Docs */}
      <button
        onClick={handleGenerateDocs}
        disabled={isProcessing}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate documentation"
      >
        <FaFileCode />
        <span>Add Docs</span>
      </button>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          <span>Processing...</span>
        </div>
      )}

      {/* Error Dialog */}
      <InputDialog
        isOpen={showErrorDialog}
        title="Fix Error"
        message="Enter the error message:"
        placeholder="e.g., TypeError: Cannot read property 'x' of undefined"
        onConfirm={handleErrorDialogConfirm}
        onCancel={() => setShowErrorDialog(false)}
      />

      {/* Rename Dialog */}
      <InputDialog
        isOpen={showRenameDialog}
        title="Rename Variable"
        message="Enter the new name:"
        placeholder="Enter new variable name"
        onConfirm={handleRenameDialogConfirm}
        onCancel={() => setShowRenameDialog(false)}
      />
    </div>
  );
};

export default AIToolbar;

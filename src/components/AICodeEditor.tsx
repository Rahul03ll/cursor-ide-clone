import React, { useState, useCallback } from 'react';
import { FaEdit, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { modifyCodeSelection, CodeSelection, DiffPatch } from '../services/aiFeatures';
import { ModelType } from '../services/gemini-api';

interface AICodeEditorProps {
  editorRef: React.RefObject<any>;
  modelType: ModelType;
  language: string;
  onApplyEdit?: (patch: DiffPatch) => void;
}

const AICodeEditor: React.FC<AICodeEditorProps> = ({
  editorRef,
  modelType,
  language,
  onApplyEdit
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPatch, setCurrentPatch] = useState<DiffPatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<CodeSelection | null>(null);

  // Get current selection from editor
  const getCurrentSelection = useCallback((): CodeSelection | null => {
    if (!editorRef.current) return null;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();

    if (!selection || !model || selection.isEmpty()) {
      return null;
    }

    const selectedText = model.getValueInRange(selection);

    return {
      code: selectedText,
      startLine: selection.startLineNumber,
      endLine: selection.endLineNumber,
      startColumn: selection.startColumn,
      endColumn: selection.endColumn
    };
  }, [editorRef]);

  // Show the edit dialog
  const showEditDialog = useCallback(() => {
    const sel = getCurrentSelection();
    if (!sel) {
      setError('Please select code to edit');
      return;
    }
    setSelection(sel);
    setIsVisible(true);
    setInstruction('');
    setCurrentPatch(null);
    setError(null);
  }, [getCurrentSelection]);

  // Process the edit instruction
  const handleEdit = useCallback(async () => {
    if (!selection || !instruction.trim()) {
      setError('Please provide an instruction');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const patch = await modifyCodeSelection(
        selection,
        instruction,
        language,
        modelType,
        (chunk) => {
          // Optional: show streaming progress
          console.log('Streaming:', chunk);
        }
      );

      setCurrentPatch(patch);
    } catch (err: any) {
      setError(err.message || 'Failed to modify code');
    } finally {
      setIsProcessing(false);
    }
  }, [selection, instruction, language, modelType]);

  // Apply the patch to the editor
  const applyPatch = useCallback(() => {
    if (!currentPatch || !editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Create edit operation
    const range = {
      startLineNumber: currentPatch.startLine,
      startColumn: 1,
      endLineNumber: currentPatch.endLine,
      endColumn: model.getLineMaxColumn(currentPatch.endLine)
    };

    editor.executeEdits('ai-edit', [{
      range,
      text: currentPatch.modified,
      forceMoveMarkers: true
    }]);

    // Callback
    if (onApplyEdit) {
      onApplyEdit(currentPatch);
    }

    // Close dialog
    setIsVisible(false);
    setCurrentPatch(null);
    setInstruction('');
  }, [currentPatch, editorRef, onApplyEdit]);

  // Cancel and close
  const handleCancel = useCallback(() => {
    setIsVisible(false);
    setCurrentPatch(null);
    setInstruction('');
    setError(null);
  }, []);

  // Render diff view
  const renderDiff = () => {
    if (!currentPatch) return null;

    const originalLines = currentPatch.original.split('\n');
    const modifiedLines = currentPatch.modified.split('\n');

    return (
      <div className="mt-4 border border-gray-300 dark:border-gray-600 rounded">
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 border-b border-gray-300 dark:border-gray-600">
          <span className="text-sm font-medium">Preview Changes</span>
        </div>
        <div className="grid grid-cols-2 gap-0 text-xs font-mono">
          {/* Original */}
          <div className="border-r border-gray-300 dark:border-gray-600">
            <div className="bg-red-100 dark:bg-red-900 px-2 py-1 text-red-800 dark:text-red-200 font-semibold">
              Original
            </div>
            <pre className="p-2 overflow-auto max-h-64 bg-red-50 dark:bg-red-950">
              {originalLines.map((line, i) => (
                <div key={i} className="text-red-700 dark:text-red-300">
                  <span className="text-gray-500 mr-2">{i + 1}</span>
                  {line || ' '}
                </div>
              ))}
            </pre>
          </div>
          {/* Modified */}
          <div>
            <div className="bg-green-100 dark:bg-green-900 px-2 py-1 text-green-800 dark:text-green-200 font-semibold">
              Modified
            </div>
            <pre className="p-2 overflow-auto max-h-64 bg-green-50 dark:bg-green-950">
              {modifiedLines.map((line, i) => (
                <div key={i} className="text-green-700 dark:text-green-300">
                  <span className="text-gray-500 mr-2">{i + 1}</span>
                  {line || ' '}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={showEditDialog}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
        title="AI Edit Selection (Ctrl+K)"
      >
        <FaEdit />
        <span>AI Edit</span>
      </button>

      {/* Edit Dialog */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Code Editor</h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {/* Selected Code Preview */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Selected Code (Lines {selection?.startLine}-{selection?.endLine})
                </label>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-32 border border-gray-300 dark:border-gray-600">
                  <code>{selection?.code}</code>
                </pre>
              </div>

              {/* Instruction Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  What would you like to change?
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="E.g., 'Add error handling', 'Optimize this loop', 'Add type hints'..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Diff Preview */}
              {renderDiff()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isProcessing && (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                {!currentPatch ? (
                  <button
                    onClick={handleEdit}
                    disabled={isProcessing || !instruction.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <FaEdit />
                        Generate Edit
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={applyPatch}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-2"
                  >
                    <FaCheck />
                    Apply Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AICodeEditor;

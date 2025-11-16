import React, { useState, useCallback } from 'react';
import { FaCheck, FaTimes, FaSpinner, FaFileAlt, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { planMultiFileEdit, MultiFileEdit, ProjectContext } from '../services/aiFeatures';
import { ModelType } from '../services/gemini-api';
import { useProject } from '../context/ProjectContext';

interface MultiFileEditPanelProps {
  modelType: ModelType;
  onClose: () => void;
  onApplyEdits: (edits: MultiFileEdit[]) => void;
}

const MultiFileEditPanel: React.FC<MultiFileEditPanelProps> = ({
  modelType,
  onClose,
  onApplyEdits
}) => {
  const { files } = useProject();
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [plannedEdits, setPlannedEdits] = useState<MultiFileEdit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Plan the multi-file edit
  const handlePlan = useCallback(async () => {
    if (!instruction.trim()) {
      setError('Please provide an instruction');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPlannedEdits([]);

    try {
      // Build project context
      const projectContext: ProjectContext = {
        files: files.map(file => ({
          path: file.name,
          content: file.content || '',
          language: file.extension || 'text'
        }))
      };

      const edits = await planMultiFileEdit(
        instruction,
        projectContext,
        modelType,
        (chunk) => {
          console.log('Planning progress:', chunk);
        }
      );

      setPlannedEdits(edits);
      
      // Auto-expand all files
      setExpandedFiles(new Set(edits.map(e => e.filePath)));
    } catch (err: any) {
      setError(err.message || 'Failed to plan edits');
    } finally {
      setIsProcessing(false);
    }
  }, [instruction, files, modelType]);

  // Apply all edits
  const handleApplyAll = useCallback(() => {
    if (plannedEdits.length === 0) return;
    onApplyEdits(plannedEdits);
    onClose();
  }, [plannedEdits, onApplyEdits, onClose]);

  // Toggle file expansion
  const toggleFile = useCallback((filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }, []);

  // Render diff for a file
  const renderDiff = (edit: MultiFileEdit) => {
    const diffLines = edit.diff.split('\n');
    
    return (
      <div className="font-mono text-xs overflow-auto max-h-96 bg-[#1e1e1e] border border-[#3e3e42] rounded">
        {diffLines.map((line, i) => {
          let className = 'px-2 py-0.5';
          if (line.startsWith('+')) {
            className += ' bg-green-900 bg-opacity-30 text-green-400';
          } else if (line.startsWith('-')) {
            className += ' bg-red-900 bg-opacity-30 text-red-400';
          } else {
            className += ' text-gray-400';
          }
          
          return (
            <div key={i} className={className}>
              {line || ' '}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#252526] rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3e3e42] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Multi-File Edit Planner</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {/* Instruction Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Describe the changes you want to make across your project:
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="E.g., 'Add error handling to all API calls', 'Refactor authentication to use JWT', 'Add TypeScript types to all components'..."
              className="w-full px-3 py-2 border border-[#3e3e42] rounded bg-[#1e1e1e] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isProcessing}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Plan Button */}
          {plannedEdits.length === 0 && (
            <div className="mb-4">
              <button
                onClick={handlePlan}
                disabled={isProcessing || !instruction.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Planning Changes...
                  </>
                ) : (
                  <>
                    <FaFileAlt />
                    Plan Changes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Planned Edits */}
          {plannedEdits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-white">
                  Planned Changes ({plannedEdits.length} files)
                </h4>
                <button
                  onClick={() => setPlannedEdits([])}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear & Start Over
                </button>
              </div>

              {plannedEdits.map((edit, index) => {
                const isExpanded = expandedFiles.has(edit.filePath);
                
                return (
                  <div key={index} className="border border-[#3e3e42] rounded overflow-hidden">
                    {/* File Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-[#2d2d30] cursor-pointer hover:bg-[#3e3e42] transition-colors"
                      onClick={() => toggleFile(edit.filePath)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        <FaFileAlt className="text-blue-400" />
                        <span className="font-medium text-white">{edit.filePath}</span>
                      </div>
                      <span className="text-sm text-gray-400">{edit.description}</span>
                    </div>

                    {/* File Diff */}
                    {isExpanded && (
                      <div className="p-4 bg-[#1e1e1e]">
                        <div className="mb-2 text-sm text-gray-400">
                          {edit.description}
                        </div>
                        {renderDiff(edit)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {plannedEdits.length > 0 && (
          <div className="px-6 py-4 border-t border-[#3e3e42] flex items-center justify-between bg-[#2d2d30]">
            <div className="text-sm text-gray-400">
              Review the changes above before applying
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[#3e3e42] rounded hover:bg-[#3e3e42] transition-colors text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAll}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-2"
              >
                <FaCheck />
                Apply All Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiFileEditPanel;

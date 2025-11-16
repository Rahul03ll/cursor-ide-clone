import React, { useCallback, useState } from 'react';
import { FaLightbulb, FaCommentDots, FaRobot, FaSpinner } from 'react-icons/fa';
import { ModelType } from '../services/unified-api';
import { explainCode, generateDocumentation } from '../services/aiFeatures';

interface EditorToolbarProps {
  editorRef: React.RefObject<any>;
  modelType: ModelType;
  language: string;
  onShowResult?: (title: string, content: string, type: 'explanation' | 'documentation') => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorRef,
  modelType,
  language,
  onShowResult
}) => {
  const [isExplaining, setIsExplaining] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  
  // Get selected code from editor
  const getSelectedCode = useCallback(() => {
    if (!editorRef.current) return null;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model || selection.isEmpty()) return null;
    
    return {
      code: model.getValueInRange(selection),
      selection: selection
    };
  }, [editorRef]);

  // Get entire file content
  const getFileContent = useCallback(() => {
    if (!editorRef.current) return null;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return null;
    
    return model.getValue();
  }, [editorRef]);

  // Handle Explain Code
  const handleExplainCode = useCallback(async () => {
    const selectedCode = getSelectedCode();
    const fileContent = getFileContent();
    
    if (!selectedCode && !fileContent) {
      if (onShowResult) {
        onShowResult('No Code', 'Please open a file or select some code to explain.', 'explanation');
      }
      return;
    }

    setIsExplaining(true);
    try {
      const codeToExplain = selectedCode?.code || fileContent || '';
      const result = await explainCode(codeToExplain, language, modelType, 'detailed');
      
      if (onShowResult) {
        onShowResult('Code Explanation', result, 'explanation');
      }
    } catch (error) {
      if (onShowResult) {
        onShowResult('Error', `Failed to explain code: ${error instanceof Error ? error.message : 'Unknown error'}`, 'explanation');
      }
    } finally {
      setIsExplaining(false);
    }
  }, [getSelectedCode, getFileContent, language, modelType, onShowResult]);

  // Handle Auto Comment
  const handleAutoComment = useCallback(async () => {
    const selectedCode = getSelectedCode();
    const fileContent = getFileContent();
    
    if (!selectedCode && !fileContent) {
      if (onShowResult) {
        onShowResult('No Code', 'Please open a file or select some code to add comments.', 'documentation');
      }
      return;
    }

    setIsCommenting(true);
    try {
      const codeToComment = selectedCode?.code || fileContent || '';
      const result = await generateDocumentation(codeToComment, language, modelType, 'both');
      
      if (onShowResult) {
        onShowResult('Generated Documentation', result, 'documentation');
      }
    } catch (error) {
      if (onShowResult) {
        onShowResult('Error', `Failed to generate documentation: ${error instanceof Error ? error.message : 'Unknown error'}`, 'documentation');
      }
    } finally {
      setIsCommenting(false);
    }
  }, [getSelectedCode, getFileContent, language, modelType, onShowResult]);

  const hasSelection = getSelectedCode() !== null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
      <div className="flex items-center gap-2 text-xs text-[#8f8f8f] font-medium">
        <FaRobot className="text-blue-400" />
        <span>AI Tools</span>
      </div>
      
      <div className="h-4 w-px bg-[#3e3e42]" />
      
      <button
        onClick={handleExplainCode}
        disabled={isExplaining || isCommenting}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#3e3e42] hover:bg-[#4a4a4a] disabled:bg-[#2a2a2a] disabled:opacity-50 rounded transition-all duration-200 text-white border border-[#3e3e42] hover:border-[#007acc] disabled:border-[#3e3e42]"
        title={`Explain ${hasSelection ? 'selected code' : 'entire file'} in detail`}
      >
        {isExplaining ? (
          <FaSpinner className="text-yellow-400 animate-spin" />
        ) : (
          <FaLightbulb className="text-yellow-400" />
        )}
        <span>{isExplaining ? 'Explaining...' : 'Explain Code'}</span>
      </button>
      
      <button
        onClick={handleAutoComment}
        disabled={isExplaining || isCommenting}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#3e3e42] hover:bg-[#4a4a4a] disabled:bg-[#2a2a2a] disabled:opacity-50 rounded transition-all duration-200 text-white border border-[#3e3e42] hover:border-[#007acc] disabled:border-[#3e3e42]"
        title={`Add comments to ${hasSelection ? 'selected code' : 'entire file'}`}
      >
        {isCommenting ? (
          <FaSpinner className="text-cyan-400 animate-spin" />
        ) : (
          <FaCommentDots className="text-cyan-400" />
        )}
        <span>{isCommenting ? 'Commenting...' : 'Auto Comment'}</span>
      </button>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2 text-xs text-[#8f8f8f]">
        <div className={`w-2 h-2 rounded-full ${hasSelection ? 'bg-green-400' : 'bg-gray-500'}`} />
        <span>{hasSelection ? 'Selected code' : 'Entire file'}</span>
      </div>
    </div>
  );
};

export default EditorToolbar;

import React from 'react';
import { FaRobot, FaCircle, FaBrain, FaCodeBranch } from 'react-icons/fa';
import { ModelType, AI_MODELS } from '../services/unified-api';

interface CursorStatusBarProps {
  currentFile?: string;
  language?: string;
  status: 'idle' | 'generating' | 'error';
  modelType: ModelType;
  position?: string;
  branch?: string;
  linesOfCode?: number;
  cursorPositions?: string;
  selectionInfo?: string;
}

const CursorStatusBar: React.FC<CursorStatusBarProps> = ({
  currentFile = 'untitled',
  language = 'plaintext',
  status,
  modelType,
  position = '1:1',
  branch = 'main',
  linesOfCode = 0,
  cursorPositions,
  selectionInfo
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'generating':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-green-500';
    }
  };

  const getLanguageLabel = () => {
    // Map file extensions to language display names
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'jsx': 'JSX',
      'ts': 'TypeScript',
      'tsx': 'TSX',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'md': 'Markdown',
      'py': 'Python',
      'go': 'Go',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'rust': 'Rust',
    };
    
    return languageMap[language] || language;
  };
  
  return (
    <div className="flex items-center justify-between h-6 px-2 text-xs bg-[#007acc] text-white overflow-hidden">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <FaCircle className={`mr-2 ${getStatusColor()}`} size={8} />
          <span>{status === 'generating' ? 'AI Working...' : 'Ready'}</span>
        </div>
        
        <div className="flex items-center">
          <FaRobot className="mr-1 text-[#b9e0ff]" size={10} />
          <span>{AI_MODELS[modelType].name}</span>
        </div>
        
        <div className="flex items-center">
          <FaCodeBranch className="mr-1" size={10} />
          <span>{branch}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div>{getLanguageLabel()}</div>
        
        <div>Lines: {linesOfCode}</div>
        
        <div>
          {cursorPositions || position}
        </div>
        
        {selectionInfo && (
          <div className="px-2 py-0.5 bg-blue-700 rounded-sm">
            {selectionInfo}
          </div>
        )}
        
        <div className="flex items-center">
          <FaBrain className="mr-1" />
          <span>{status === 'generating' ? 'Processing' : 'Ready'}</span>
        </div>
      </div>
    </div>
  );
};

export default CursorStatusBar;

import React from 'react';
import { FaChevronRight, FaFolder, FaFile } from 'react-icons/fa';
import { getBreadcrumbsFromPath } from '../utils/codeUtils';

interface BreadcrumbsNavProps {
  currentFilePath: string;
  onNavigate?: (path: string) => void;
}

const BreadcrumbsNav: React.FC<BreadcrumbsNavProps> = ({
  currentFilePath,
  onNavigate
}) => {
  const pathSegments = getBreadcrumbsFromPath(currentFilePath);
  
  const handleClick = (index: number) => {
    if (!onNavigate) return;
    
    // Navigate to the clicked path segment
    const path = pathSegments.slice(0, index + 1).join('/');
    onNavigate(path);
  };
  
  if (!pathSegments.length) {
    return (
      <div className="flex items-center h-8 px-3 bg-[#252526] text-[#cccccc] border-b border-[#3e3e42]">
        <span className="text-xs text-[#8f8f8f]">No file selected</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center h-8 px-3 bg-[#252526] text-[#cccccc] border-b border-[#3e3e42] overflow-x-auto whitespace-nowrap">
      {pathSegments.map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <FaChevronRight className="mx-1 text-[#8f8f8f]" size={10} />
          )}
          
          <button
            className={`flex items-center px-1 py-0.5 rounded hover:bg-[#2a2d2e] text-xs ${
              index === pathSegments.length - 1 ? 'text-[#cccccc] font-medium' : 'text-[#8f8f8f]'
            }`}
            onClick={() => handleClick(index)}
          >
            {index === pathSegments.length - 1 ? (
              <FaFile className="mr-1" size={12} />
            ) : (
              <FaFolder className="mr-1" size={12} />
            )}
            {segment}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default BreadcrumbsNav;

import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCopy, FaCheckCircle, FaLightbulb, FaCommentDots, FaExpand, FaCompress } from 'react-icons/fa';

interface FloatingAIResultProps {
  title: string;
  content: string;
  type: 'explanation' | 'documentation';
  onClose: () => void;
  position?: { x: number; y: number };
}

const FloatingAIResult: React.FC<FloatingAIResultProps> = ({
  title,
  content,
  type,
  onClose,
  position = { x: 100, y: 100 }
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState(position);
  const [copied, setCopied] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setWindowPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'explanation':
        return <FaLightbulb className="text-yellow-400" />;
      case 'documentation':
        return <FaCommentDots className="text-cyan-400" />;
      default:
        return <FaLightbulb className="text-gray-400" />;
    }
  };

  const windowStyle = isMaximized 
    ? {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }
    : {
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`,
        width: '600px',
        height: '500px'
      };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={windowRef}
        className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        style={windowStyle}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42] cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-medium text-white">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-[#3e3e42] rounded transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <FaCompress className="text-gray-400 text-sm" />
              ) : (
                <FaExpand className="text-gray-400 text-sm" />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-[#3e3e42] rounded transition-colors"
              title="Copy content"
            >
              {copied ? (
                <FaCheckCircle className="text-green-400 text-sm" />
              ) : (
                <FaCopy className="text-gray-400 text-sm" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#3e3e42] rounded transition-colors"
              title="Close window"
            >
              <FaTimes className="text-gray-400 text-sm" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#2d2d30] border-t border-[#3e3e42]">
          <div className="text-xs text-gray-400 text-center">
            {copied ? 'Copied to clipboard!' : 'Click and drag to move • Double-click to maximize'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingAIResult;

import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

export interface Command {
  id?: string;
  title: string;
  category: string;
  shortcut?: string;
  execute: () => void;
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose: () => void;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!search) {
      setFilteredCommands(commands);
      return;
    }
    
    const filtered = commands.filter(cmd => 
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
    );
    
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [search, commands]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].execute();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[20vh] z-50">
      <div className="bg-[#252526] rounded-md shadow-lg w-[600px] max-w-full">
        <div className="flex items-center p-2 border-b border-[#3e3e42]">
          <FaSearch className="text-[#cccccc] mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search commands..."
            className="flex-1 bg-transparent border-none outline-none text-[#cccccc] placeholder-[#6e6e6e]"
          />
          <button onClick={onClose} className="text-[#cccccc] hover:text-white">
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-[#cccccc]">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`p-2 flex justify-between items-center cursor-pointer hover:bg-[#37373d] ${
                  index === selectedIndex ? 'bg-[#094771]' : ''
                }`}
                onClick={() => {
                  cmd.execute();
                  onClose();
                }}
              >
                <div>
                  <div className="text-[#cccccc]">{cmd.title}</div>
                  <div className="text-xs text-[#8f8f8f]">{cmd.category}</div>
                </div>
                {cmd.shortcut && (
                  <div className="text-xs bg-[#3e3e42] px-2 py-1 rounded text-[#cccccc]">
                    {cmd.shortcut}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

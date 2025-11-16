import React, { useState } from 'react';
import { FaCaretDown } from 'react-icons/fa';

// Interface for menu items
interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  submenu?: MenuItem[];
  divider?: boolean;
}

// Interface for menu props
interface MenuProps {
  label: string;
  items: MenuItem[];
  isOpen: boolean;
  onClick: () => void;
  onClose: () => void;
}

// Interface for main menu bar props
interface MainMenuBarProps {
  onFileAction?: (action: string) => void;
  onEditAction?: (action: string) => void;
  onViewAction?: (action: string) => void;
  onTerminalAction?: () => void;
}

// Single dropdown menu component
const DropdownMenu: React.FC<MenuProps> = ({ label, items, isOpen, onClick, onClose }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`px-3 py-1 hover:bg-[#3c3c3c] ${isOpen ? 'bg-[#3c3c3c]' : ''}`}
      >
        {label}
      </button>
      
      {isOpen && (
        <>
          {/* Invisible overlay to capture clicks outside the menu */}
          <div 
            className="fixed inset-0 z-20" 
            onClick={onClose}
          />
          
          <div className="absolute left-0 top-full mt-0 w-56 bg-[#252526] border border-[#3e3e42] shadow-lg z-30">
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.divider ? (
                  <div className="mx-2 my-1 border-t border-[#3e3e42]"></div>
                ) : (
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] flex justify-between items-center"
                    onClick={() => {
                      if (item.action) item.action();
                      onClose();
                    }}
                    disabled={!item.action && !item.submenu}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[#8a8a8a] text-xs">{item.shortcut}</span>
                    )}
                    {item.submenu && (
                      <FaCaretDown className="transform -rotate-90 ml-2" />
                    )}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Main component for the top menu bar
const MainMenuBar: React.FC<MainMenuBarProps> = ({ 
  onFileAction, 
  onEditAction, 
  onViewAction, 
  onTerminalAction 
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  
  // Helper to create menu handler
  const createMenuHandler = (menuName: string) => () => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };
  
  // Close all menus
  const closeAllMenus = () => {
    setOpenMenu(null);
  };
  
  // File menu items
  const fileMenuItems: MenuItem[] = [
    { label: 'New File', shortcut: 'Ctrl+N', action: () => onFileAction?.('new-file') },
    { label: 'New Folder', action: () => onFileAction?.('new-folder') },
    { divider: true },
    { label: 'Save', shortcut: 'Ctrl+S', action: () => onFileAction?.('save') },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => onFileAction?.('save-as') },
    { divider: true },
    { label: 'Export Project', action: () => onFileAction?.('export') },
    { divider: true },
    { label: 'Exit', action: () => onFileAction?.('exit') }
  ];
  
  // Edit menu items
  const editMenuItems: MenuItem[] = [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => onEditAction?.('undo') },
    { label: 'Redo', shortcut: 'Ctrl+Y', action: () => onEditAction?.('redo') },
    { divider: true },
    { label: 'Cut', shortcut: 'Ctrl+X', action: () => onEditAction?.('cut') },
    { label: 'Copy', shortcut: 'Ctrl+C', action: () => onEditAction?.('copy') },
    { label: 'Paste', shortcut: 'Ctrl+V', action: () => onEditAction?.('paste') },
    { divider: true },
    { label: 'Find', shortcut: 'Ctrl+F', action: () => onEditAction?.('find') },
    { label: 'Replace', shortcut: 'Ctrl+H', action: () => onEditAction?.('replace') }
  ];
  
  // Selection menu items
  const selectionMenuItems: MenuItem[] = [
    { label: 'Select All', shortcut: 'Ctrl+A', action: () => onEditAction?.('select-all') },
    { label: 'Expand Selection', shortcut: 'Shift+Alt+→', action: () => onEditAction?.('expand-selection') },
    { label: 'Shrink Selection', shortcut: 'Shift+Alt+←', action: () => onEditAction?.('shrink-selection') },
    { divider: true },
    { label: 'Copy Line Up', shortcut: 'Shift+Alt+↑', action: () => onEditAction?.('copy-line-up') },
    { label: 'Copy Line Down', shortcut: 'Shift+Alt+↓', action: () => onEditAction?.('copy-line-down') },
    { label: 'Move Line Up', shortcut: 'Alt+↑', action: () => onEditAction?.('move-line-up') },
    { label: 'Move Line Down', shortcut: 'Alt+↓', action: () => onEditAction?.('move-line-down') }
  ];
  
  // View menu items
  const viewMenuItems: MenuItem[] = [
    { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => onViewAction?.('command-palette') },
    { divider: true },
    { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => onViewAction?.('explorer') },
    { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => onViewAction?.('search') },
    { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: () => onViewAction?.('source-control') },
    { label: 'Run and Debug', shortcut: 'Ctrl+Shift+D', action: () => onViewAction?.('debug') },
    { divider: true },
    { label: 'Terminal', shortcut: 'Ctrl+`', action: () => onViewAction?.('terminal') },
    { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: () => onViewAction?.('problems') },
    { label: 'Output', shortcut: 'Ctrl+Shift+U', action: () => onViewAction?.('output') },
    { divider: true },
    { label: 'Word Wrap', action: () => onViewAction?.('word-wrap') },
    { label: 'Theme', action: () => onViewAction?.('theme') }
  ];
  
  // Go menu items
  const goMenuItems: MenuItem[] = [
    { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => onViewAction?.('go-to-file') },
    { label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O', action: () => onViewAction?.('go-to-symbol') },
    { divider: true },
    { label: 'Go to Line/Column...', shortcut: 'Ctrl+G', action: () => onViewAction?.('go-to-line') },
    { label: 'Go to Definition', shortcut: 'F12', action: () => onViewAction?.('go-to-definition') },
    { label: 'Go to References', shortcut: 'Shift+F12', action: () => onViewAction?.('go-to-references') }
  ];
  
  // Run menu items
  const runMenuItems: MenuItem[] = [
    { label: 'Start Debugging', shortcut: 'F5', action: () => onViewAction?.('start-debugging') },
    { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: () => onViewAction?.('run-without-debugging') },
    { divider: true },
    { label: 'Toggle Breakpoint', shortcut: 'F9', action: () => onViewAction?.('toggle-breakpoint') }
  ];
  
  // Terminal menu items
  const terminalMenuItems: MenuItem[] = [
    { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: onTerminalAction },
    { label: 'Split Terminal', action: () => {} },
    { divider: true },
    { label: 'Run Task...', shortcut: 'Ctrl+Shift+B', action: () => {} },
    { label: 'Run Build Task...', action: () => {} },
    { divider: true },
    { label: 'Configure Tasks...', action: () => {} }
  ];
  
  // Help menu items
  const helpMenuItems: MenuItem[] = [
    { label: 'Documentation', action: () => window.open('https://github.com/yourusername/ai-coding-ide', '_blank') },
    { label: 'Report Issue', action: () => window.open('https://github.com/yourusername/ai-coding-ide/issues', '_blank') },
    { divider: true },
    { label: 'About', action: () => alert('AI Coding IDE v0.1.0\nPowered by advanced AI models\n© 2025 Your Company') }
  ];
  
  return (
    <div className="flex bg-[#252526] text-[#cccccc] text-sm select-none border-b border-[#3e3e42]">
      <DropdownMenu
        label="File"
        items={fileMenuItems}
        isOpen={openMenu === 'file'}
        onClick={createMenuHandler('file')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="Edit"
        items={editMenuItems}
        isOpen={openMenu === 'edit'}
        onClick={createMenuHandler('edit')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="Selection"
        items={selectionMenuItems}
        isOpen={openMenu === 'selection'}
        onClick={createMenuHandler('selection')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="View"
        items={viewMenuItems}
        isOpen={openMenu === 'view'}
        onClick={createMenuHandler('view')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="Go"
        items={goMenuItems}
        isOpen={openMenu === 'go'}
        onClick={createMenuHandler('go')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="Run"
        items={runMenuItems}
        isOpen={openMenu === 'run'}
        onClick={createMenuHandler('run')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="Terminal"
        items={terminalMenuItems}
        isOpen={openMenu === 'terminal'}
        onClick={createMenuHandler('terminal')}
        onClose={closeAllMenus}
      />
      <DropdownMenu
        label="Help"
        items={helpMenuItems}
        isOpen={openMenu === 'help'}
        onClick={createMenuHandler('help')}
        onClose={closeAllMenus}
      />
    </div>
  );
};

export default MainMenuBar;

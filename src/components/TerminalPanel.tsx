import React, { useState, useRef, useEffect } from 'react';
import { FaTerminal, FaAngleRight, FaTimes } from 'react-icons/fa';

interface TerminalPanelProps {
  onClose: () => void;
}

interface TerminalCommand {
  command: string;
  output: string;
  isError?: boolean;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ onClose }) => {
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([
    { 
      command: '', 
      output: 'Welcome to AI Coding IDE Terminal\nThis is a simulated terminal for demonstration purposes.\nType "help" for available commands.'
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Demo commands that could be simulated
  const availableCommands = {
    help: 'Available commands: help, clear, echo, ls, pwd, date, version, npm',
    clear: 'CLEAR_TERMINAL',
    echo: (args: string) => args,
    ls: 'index.html\nstyles.css\nscript.js\npackage.json',
    pwd: '/project',
    date: () => new Date().toString(),
    version: 'AI Coding IDE Terminal v1.0',
    npm: (args: string) => {
      if (args.includes('install')) {
        return `Installing packages...\nAdded 42 packages in 2.5s\n+ react@19.1.0\n+ typescript@4.9.5`;
      } else if (args.includes('start')) {
        return `Starting development server...\nCompiled successfully!\nYou can now view the project at http://localhost:3000`;
      } else if (args.includes('build')) {
        return `Creating production build...\nCompiled successfully!\nThe build folder is ready to be deployed.`;
      } else {
        return 'Usage: npm <command> (run "npm help" for commands)';
      }
    }
  };

  useEffect(() => {
    // Auto-focus the input field
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever command history changes
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [commandHistory]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCommand.trim()) return;
    
    // Save command input history for up/down arrow navigation
    const commandInputs = commandHistory
      .map(cmd => cmd.command)
      .filter(cmd => cmd.length > 0);
    
    if (!commandInputs.includes(currentCommand)) {
      commandInputs.push(currentCommand);
    }
    
    // Process the command
    const [cmd, ...args] = currentCommand.trim().split(' ');
    const argsStr = args.join(' ');
    
    let output = '';
    let isError = false;
    
    // Simulate terminal command responses
    if (cmd === 'clear') {
      setCommandHistory([]);
      setCurrentCommand('');
      return;
    } else if (cmd in availableCommands) {
      const command = availableCommands[cmd as keyof typeof availableCommands];
      
      if (typeof command === 'function') {
        output = command(argsStr);
      } else {
        output = command;
      }
    } else {
      output = `Command not found: ${cmd}. Type "help" for available commands.`;
      isError = true;
    }
    
    setCommandHistory(prev => [
      ...prev, 
      { command: currentCommand, output, isError }
    ]);
    setCurrentCommand('');
    setCommandHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navigate command history with up/down arrows
    const filteredHistory = commandHistory
      .map(cmd => cmd.command)
      .filter(cmd => cmd.length > 0);
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistoryIndex < filteredHistory.length - 1) {
        const newIndex = commandHistoryIndex + 1;
        setCommandHistoryIndex(newIndex);
        setCurrentCommand(filteredHistory[filteredHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistoryIndex > 0) {
        const newIndex = commandHistoryIndex - 1;
        setCommandHistoryIndex(newIndex);
        setCurrentCommand(filteredHistory[filteredHistory.length - 1 - newIndex]);
      } else {
        setCommandHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full border-t dark:border-gray-700 border-gray-200 bg-black text-green-400 font-mono text-sm">
      <div className="p-2 flex justify-between items-center bg-gray-900">
        <div className="flex items-center">
          <FaTerminal className="mr-2" />
          <h3 className="font-medium">Terminal</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-700">
          <FaTimes />
        </button>
      </div>
      
      <div ref={terminalRef} className="flex-grow overflow-auto p-2 space-y-1">
        {commandHistory.map((item, index) => (
          <div key={index}>
            {item.command && (
              <div className="flex items-start">
                <span className="mr-1">$</span>
                <span>{item.command}</span>
              </div>
            )}
            {item.output && (
              <div className={`whitespace-pre-wrap ml-2 ${item.isError ? 'text-red-500' : ''}`}>
                {item.output}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleCommand} className="p-2 border-t border-gray-700 flex items-center">
        <FaAngleRight className="mr-1" />
        <input
          ref={inputRef}
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent focus:outline-none"
          placeholder="Type command..."
        />
      </form>
    </div>
  );
};

export default TerminalPanel;

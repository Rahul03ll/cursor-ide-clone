import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import PythonPreview from './PythonPreview';
import { useProject } from '../context/ProjectContext';
import { ModelType } from '../services/unified-api';
import { 
  FaKeyboard, 
  FaPlus, 
  FaTerminal, 
  FaGitAlt, 
  FaRobot, 
  FaCog 
} from 'react-icons/fa';

// Import components
import CommandPalette from './CommandPalette';
import CursorStatusBar from './CursorStatusBar';
import MinimalModelSelector from './MinimalModelSelector';
import EnhancedChatPanel from './EnhancedChatPanel';
import EnhancedFileExplorer from './EnhancedFileExplorer';
import EditorToolbar from './EditorToolbar';
import FloatingAIResult from './FloatingAIResult';
import EnhancedGitPanel from './EnhancedGitPanel';
import TerminalPanel from './TerminalPanel';
import BreadcrumbsNav from './BreadcrumbsNav';
import InlineAISuggestions from './InlineAISuggestions';
import { countLinesOfCode } from '../utils/codeUtils';

// Props for IDELayout component
interface IDELayoutProps {
  showCommandPalette?: boolean;
  setShowCommandPalette?: (show: boolean) => void;
}

const IDELayout = ({ 
  showCommandPalette = false, 
  setShowCommandPalette 
}: IDELayoutProps) => {
  const { 
    currentFile,
    setCurrentFile,
    updateFileContent,
    rootNode
  } = useProject();
  
  const { toggleTheme } = useTheme();
  const editorRef = useRef<any>(null);
  
  // State
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState('python');
  const [localShowCommandPalette, setLocalShowCommandPalette] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [floatingResult, setFloatingResult] = useState<{
    id: string;
    title: string;
    content: string;
    type: 'explanation' | 'documentation';
    position: { x: number; y: number };
  } | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [currentPosition, setCurrentPosition] = useState('1:1');
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini'); // Using Gemini as the default model
  const [fontSize] = useState<number>(14);
  const [wordWrap] = useState<'on' | 'off'>('on');
  const [linesOfCode, setLinesOfCode] = useState(0);
  
  // AI Result handler
  const handleShowAIResult = useCallback((title: string, content: string, type: 'explanation' | 'documentation') => {
    const newResult = {
      id: `ai-result-${Date.now()}`,
      title,
      content,
      type,
      position: {
        x: 100 + (floatingResult ? 50 : 0), // Offset new windows
        y: 100 + (floatingResult ? 50 : 0)
      }
    };
    
    setFloatingResult(newResult);
  }, [floatingResult]);

  // Close floating result
  const handleCloseFloatingResult = useCallback(() => {
    setFloatingResult(null);
  }, []);
  
  // Determine command palette visibility
  const isCommandPaletteVisible = showCommandPalette ?? localShowCommandPalette;
  
  // Toggle command palette
  const toggleCommandPalette = useCallback((value: boolean) => {
    if (setShowCommandPalette) {
      setShowCommandPalette(value);
    } else {
      setLocalShowCommandPalette(value);
    }
  }, [setShowCommandPalette]);
  
  // Track changes to current file to update code and language
  useEffect(() => {
    if (currentFile && currentFile.content !== undefined) {
      setCode(currentFile.content);
      
      // Update language based on file extension - Python-focused
      const fileExt = currentFile.name.split('.').pop()?.toLowerCase() || '';
      let lang = 'python'; // Default to Python
      
      if (fileExt === 'py' || fileExt === 'pyw') lang = 'python';
      else if (fileExt === 'pyi') lang = 'python'; // Python stub files
      else if (fileExt === 'txt') lang = 'plaintext';
      else if (fileExt === 'md') lang = 'markdown';
      else if (fileExt === 'json') lang = 'json';
      else if (fileExt === 'yaml' || fileExt === 'yml') lang = 'yaml';
      else if (fileExt === 'toml') lang = 'toml';
      else if (fileExt === 'ini') lang = 'ini';
      else if (fileExt === 'cfg') lang = 'ini';
      else if (fileExt === 'requirements') lang = 'plaintext';
      
      setLanguage(lang);
    }
  }, [currentFile]);

  // Update file content when code changes
  const handleCodeChange = (newValue: string | undefined) => {
    if (newValue === undefined) return;
    
    setCode(newValue);
    
    if (currentFile) {
      updateFileContent(currentFile.id, newValue);
    }
  };

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Set initial code if a file is already selected
    if (currentFile && currentFile.content) {
      setCode(currentFile.content);
    }
    
    // Count lines of code
    setLinesOfCode(countLinesOfCode(code));
    
    // Track cursor position
    editor.onDidChangeCursorPosition(e => {
      setCurrentPosition(`${e.position.lineNumber}:${e.position.column}`);
    });
    
    // Keep track of lines of code
    editor.onDidChangeModelContent(() => {
      setLinesOfCode(countLinesOfCode(editor.getValue()));
    });
    
    // Set editor focus on mount
    editor.focus();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toggleCommandPalette(true);
      }
      
      // Toggle chat: Ctrl+/ / Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowChatInterface(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  // UI Rendering
  return (
    <div data-testid="ide-layout" className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* Command Palette (conditionally rendered) */}
      {isCommandPaletteVisible && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]">
          <CommandPalette 
            onClose={() => toggleCommandPalette(false)}
            commands={[
              { 
                id: 'toggleTheme', 
                title: 'Toggle Theme', 
                category: 'Appearance',
                shortcut: 'Alt+T',
                execute: () => toggleTheme()
              },
              { 
                id: 'toggleChat', 
                title: 'Toggle Chat Panel', 
                category: 'Panels',
                shortcut: 'Ctrl+/',
                execute: () => setShowChatInterface(prev => !prev)
              },
              { 
                id: 'toggleTerminal', 
                title: 'Toggle Terminal', 
                category: 'Panels',
                shortcut: 'Ctrl+`',
                execute: () => setShowTerminal(prev => !prev)
              }
            ]}
          />
        </div>
      )}
      
      {/* Error display removed as error state was cleaned up */}
      
      {/* Top Bar */}
      <div className="flex items-center p-2 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center space-x-4">
          <button 
            className="p-2 rounded hover:bg-[#3e3e42] transition-colors"
            onClick={() => toggleCommandPalette(true)}
            title="Command Palette (Ctrl+P)"
          >
            <FaKeyboard />
          </button>
          
          <button 
            className="p-2 rounded hover:bg-[#3e3e42] transition-colors"
            onClick={() => setShowChatInterface(prev => !prev)}
            title="AI Chat (Ctrl+/)"
          >
            <FaRobot />
          </button>
          
          <button 
            className="p-2 rounded hover:bg-[#3e3e42] transition-colors"
            onClick={() => setShowTerminal(prev => !prev)}
            title="Terminal"
          >
            <FaTerminal />
          </button>
          
          <button 
            className="p-2 rounded hover:bg-[#3e3e42] transition-colors"
            onClick={() => setShowGitPanel(prev => !prev)}
            title="Git"
          >
            <FaGitAlt />
          </button>
        </div>
        
        <div className="mx-4 flex-1">
          {/* Only show breadcrumbs if a file is selected */}
          {currentFile && (
            <BreadcrumbsNav 
              currentFilePath={currentFile.name} 
              onNavigate={(path) => console.log('Navigate to', path)}
            />
          )}
        </div>
        
        <div className="flex items-center">
          <MinimalModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <button 
            className="ml-4 p-2 rounded hover:bg-[#3e3e42] transition-colors"
            onClick={() => toggleTheme()}
            title="Toggle Theme"
          >
            <FaCog />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Explorer Panel */}
          <Panel defaultSize={15} minSize={10}>
            <div className="h-full flex flex-col bg-[#252526] border-r border-[#3e3e42]">
              <div className="p-2 font-bold flex items-center justify-between border-b border-[#3e3e42]">
                <span>Explorer</span>
                <button 
                  className="p-1 rounded hover:bg-[#3e3e42] transition-colors"
                  onClick={() => console.log('Add new file')}
                  title="New File"
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-2">
                {rootNode && (
                  <EnhancedFileExplorer 
                    rootNode={rootNode}
                    onSelectFile={setCurrentFile}
                    selectedFileId={currentFile?.id}
                  />
                )}
              </div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-[1px] bg-[#3e3e42] hover:bg-[#0e639c] cursor-col-resize transition-colors" />
          
          {/* Editor Panel */}
          <Panel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col relative">
              
              {/* Editor Toolbar */}
              <EditorToolbar
                editorRef={editorRef}
                modelType={selectedModel}
                language={language}
                onShowResult={handleShowAIResult}
              />
              
              {/* Inline AI suggestions */}
              {currentFile && (
                <InlineAISuggestions 
                  currentFile={currentFile}
                  modelType={selectedModel}
                  onSuggestionApplied={(newCode) => handleCodeChange(newCode)}
                />
              )}
              
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: true },
                  fontSize: fontSize,
                  wordWrap: wordWrap,
                  automaticLayout: true,
                  fontFamily: 'Cascadia Code, Consolas, Monaco, monospace',
                  fontLigatures: true,
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  scrollbar: {
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    vertical: 'visible',
                    horizontal: 'visible',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                  }
                }}
                onMount={handleEditorDidMount}
              />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-[1px] bg-[#3e3e42] hover:bg-[#0e639c] cursor-col-resize transition-colors" />
          
          {/* Preview/Chat/Terminal Panel */}
          <Panel defaultSize={30} minSize={20}>
            <PanelGroup direction="vertical">
              {/* Python Output Panel - Dynamic sizing based on open panels */}
              <Panel defaultSize={
                showChatInterface ? 35 : 
                showTerminal || showGitPanel ? 70 : 
                100
              } minSize={20}>
                <div className="h-full">
                  <PythonPreview code={code} />
                </div>
              </Panel>
              
              {/* Chat Panel - Resizable */}
              {showChatInterface && (
                <>
                  <PanelResizeHandle className="h-[1px] bg-[#3e3e42] hover:bg-[#0e639c] cursor-row-resize transition-colors" />
                  <Panel defaultSize={65} minSize={30}>
                    <div className="h-full overflow-hidden">
                      <EnhancedChatPanel 
                        onClose={() => setShowChatInterface(false)}
                        currentFile={currentFile}
                        currentFileContent={code}
                        modelType={selectedModel}
                        language={language}
                      />
                    </div>
                  </Panel>
                </>
              )}
              
              {showTerminal && (
                <>
                  <PanelResizeHandle className="h-[1px] bg-[#3e3e42] hover:bg-[#0e639c] cursor-row-resize transition-colors" />
                  <Panel>
                    <TerminalPanel onClose={() => setShowTerminal(false)} />
                  </Panel>
                </>
              )}
              
              {showGitPanel && (
                <>
                  <PanelResizeHandle className="h-[1px] bg-[#3e3e42] hover:bg-[#0e639c] cursor-row-resize transition-colors" />
                  <Panel>
                    <EnhancedGitPanel onClose={() => setShowGitPanel(false)} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
        
        {/* Floating AI Result Window */}
        {floatingResult && (
          <FloatingAIResult
            title={floatingResult.title}
            content={floatingResult.content}
            type={floatingResult.type}
            onClose={handleCloseFloatingResult}
            position={floatingResult.position}
          />
        )}
        
        {/* Status Bar */}
        <CursorStatusBar 
          currentFile={currentFile?.name || 'untitled'}
          language={language}
          status="idle"
          modelType={selectedModel}
          position={currentPosition}
          branch="main"
          linesOfCode={linesOfCode}
        />
      </div>
    </div>
  );
};

export default IDELayout;

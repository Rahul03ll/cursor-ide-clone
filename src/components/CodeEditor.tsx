import React, { useEffect, useState } from 'react';
import Editor from "@monaco-editor/react";
import { useTheme } from '../context/ThemeContext';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  language = "javascript", 
  onChange, 
  readOnly = false 
}) => {
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState('vs-dark');

  useEffect(() => {
    // Set the Monaco editor theme based on the app theme
    setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs-light');
  }, [theme]);

  return (
    <div className="w-full h-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={code}
        theme={editorTheme}
        onChange={(value) => onChange(value || '')}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}

export default CodeEditor;

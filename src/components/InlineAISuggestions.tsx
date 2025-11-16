import React, { useEffect, useState } from 'react';
import { ModelType, streamGenerateCode } from '../services/unified-api';

interface InlineSuggestionProps {
  editorRef?: React.RefObject<any>;
  cursorPosition?: { lineNumber: number; column: number };
  currentFile: any;
  modelType: ModelType;
  isEnabled?: boolean;
  onSuggestionApplied?: (newCode: string) => void;
}

export interface InlineSuggestion {
  text: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

const InlineAISuggestions: React.FC<InlineSuggestionProps> = ({ 
  editorRef, 
  cursorPosition, 
  currentFile,
  modelType,
  isEnabled = true,
  onSuggestionApplied
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<InlineSuggestion | null>(null);
  const suggestionDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isEnabled || !editorRef?.current || !currentFile || !cursorPosition || isGenerating) return;
    
    // Clear any existing suggestion when cursor moves
    if (currentSuggestion) {
      clearInlineSuggestions();
    }
    
    // Debounce the suggestion request
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    suggestionDebounceRef.current = setTimeout(() => {
      generateInlineSuggestion();
    }, 800); // Wait for 800ms of inactivity before suggesting
    
    return () => {
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorPosition, currentFile, isEnabled]);
  
  const clearInlineSuggestions = () => {
    if (!editorRef?.current) return;
    
    // Get all decorations and remove them
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    
    const oldDecorations = editor.getModel().getAllDecorations()
      .filter((d: any) => d.options.inlineClassName === 'inline-suggestion')
      .map((d: any) => d.id);
    
    if (oldDecorations.length > 0) {
      editor.getModel().deltaDecorations(oldDecorations, []);
    }
    
    setCurrentSuggestion(null);
  };
  
  const generateInlineSuggestion = async () => {
    if (!editorRef?.current || !currentFile || !currentFile.content || !cursorPosition) return;
    
    try {
      setIsGenerating(true);
      
      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) {
        setIsGenerating(false);
        return;
      }
      
      const currentText = model.getValue();
      const lines = currentText.split('\n');
      const currentLine = lines[cursorPosition.lineNumber - 1] || '';
      const prefixText = currentLine.substring(0, cursorPosition.column - 1);
      
      // Don't suggest on empty lines or when typing comments
      if (!prefixText.trim() || prefixText.trim().startsWith('//') || prefixText.trim().startsWith('/*')) {
        setIsGenerating(false);
        return;
      }
      
      // Get context from surrounding code (few lines before and after)
      const startLine = Math.max(0, cursorPosition.lineNumber - 5);
      const endLine = Math.min(lines.length, cursorPosition.lineNumber + 5);
      const contextLines = lines.slice(startLine, endLine);
      const fileExtension = currentFile.extension || '';
      
      let completionText = '';
      await streamGenerateCode(
        `Complete this ${fileExtension} code snippet with a relevant continuation that follows the existing code style:
\`\`\`
${contextLines.join('\n')}
\`\`\`
Current position is at line ${cursorPosition.lineNumber}, column ${cursorPosition.column}, after text: "${prefixText}"
Provide ONLY the completion text with no explanation. The completion should be 1-3 lines at most.`,
        modelType,
        undefined,
        (chunk) => {
          // Just collect the chunks, don't update UI yet
          completionText += chunk;
        },
        (fullResponse) => {
          completionText = fullResponse;
          
          // Clean up any markdown code blocks, comments, or explanations
          // eslint-disable-next-line no-useless-escape
          completionText = completionText.replace(/```[\s\S]*?```/g, '').trim();
          completionText = completionText.replace(/^```\w*\n/gm, '').replace(/\n```$/gm, '');
          
          // Apply the suggestion
          if (completionText) {
            const suggestion: InlineSuggestion = {
              text: completionText,
              range: {
                startLineNumber: cursorPosition.lineNumber,
                startColumn: cursorPosition.column,
                endLineNumber: cursorPosition.lineNumber + completionText.split('\n').length - 1,
                endColumn: completionText.split('\n').length > 1 
                  ? completionText.split('\n').pop()?.length || 0 
                  : cursorPosition.column + completionText.length
              }
            };
            
            showInlineSuggestion(suggestion);
          }
        },
        (error) => {
          console.error('Error generating inline suggestion:', error);
        }
      );
    } catch (error) {
      console.error('Error in generateInlineSuggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const showInlineSuggestion = (suggestion: InlineSuggestion) => {
    if (!editorRef?.current) return;
    
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    
    // Clear any existing suggestions
    clearInlineSuggestions();
    
    // Add the new suggestion as a decoration with enhanced styling
    editor.getModel().deltaDecorations([], [{
      range: suggestion.range,
      options: {
        inlineClassName: 'inline-suggestion',
        after: {
          content: suggestion.text,
          inlineClassName: 'inline-suggestion-text'
        },
        hoverMessage: { 
          value: '💡 AI Suggestion - Press Tab to accept, Escape to dismiss' 
        }
      }
    }]);
    
    // Add AI indicator decoration
    editor.getModel().deltaDecorations([], [{
      range: {
        startLineNumber: suggestion.range.startLineNumber,
        startColumn: suggestion.range.startColumn,
        endLineNumber: suggestion.range.startLineNumber,
        endColumn: suggestion.range.startColumn
      },
      options: {
        before: {
          content: '🤖',
          inlineClassName: 'ai-suggestion-indicator',
          margin: '0 4px 0 0'
        },
        stickiness: 1 // Never stick
      }
    }]);
    
    setCurrentSuggestion(suggestion);
    
    // Add event listeners for accepting suggestions
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && currentSuggestion) {
        e.preventDefault();
        acceptSuggestion();
      } else if (e.key === 'Escape') {
        clearInlineSuggestions();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Clear suggestions when user continues typing
        clearInlineSuggestions();
      }
    };
    
    // Add event listener
    editor.getDomNode()?.addEventListener('keydown', handleKeyDown);
    
    // Clear suggestion when cursor moves away
    const handleCursorPositionChange = () => {
      const position = editor.getPosition();
      if (position && (
        position.lineNumber !== suggestion.range.startLineNumber ||
        position.column < suggestion.range.startColumn ||
        position.column > suggestion.range.endColumn + 10
      )) {
        clearInlineSuggestions();
      }
    };
    
    editor.onDidChangeCursorPosition(handleCursorPositionChange);
    
    // Clean up
    return () => {
      editor.getDomNode()?.removeEventListener('keydown', handleKeyDown);
      editor.onDidChangeCursorPosition(null);
    };
  };
  
  const acceptSuggestion = () => {
    if (!currentSuggestion || (!editorRef?.current && !onSuggestionApplied)) return;
    
    if (editorRef?.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;
      
      // Apply the suggestion to the editor
      editor.executeEdits('inline-suggestion', [
        {
          range: currentSuggestion.range,
          text: currentSuggestion.text,
          forceMoveMarkers: true
        }
      ]);
      
      // Show visual feedback by briefly highlighting the applied text
      const decorationId = model.deltaDecorations([], [{
        range: currentSuggestion.range,
        options: {
          className: 'applied-suggestion',
          isWholeLine: false
        }
      }]);
      
      // Remove the highlight after 1 second
      setTimeout(() => {
        model.deltaDecorations([decorationId[0]], []);
      }, 1000);
    }
    
    // If onSuggestionApplied callback is provided, call it with the updated code
    if (onSuggestionApplied) {
      onSuggestionApplied(currentSuggestion.text);
    }
    
    // Clear the suggestion after accepting
    clearInlineSuggestions();
  };
  
  // This component doesn't render anything visible
  // It just provides the inline suggestion functionality
  return null;
};

export default InlineAISuggestions;

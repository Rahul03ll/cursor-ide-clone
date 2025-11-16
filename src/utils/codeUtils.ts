import { FileNode } from '../context/ProjectContext';

/**
 * Extracts HTML, CSS, and JavaScript code from AI response text
 * @param text The response text from the AI
 * @returns Object containing extracted code contents or defaults
 */
export const extractCodeFromResponse = (text: string = '') => {
  // Extract HTML code
  const htmlMatch = text.match(/```html([\s\S]*?)```/i);
  const htmlContent = htmlMatch ? htmlMatch[1].trim() : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Welcome to the Generated Page</h1>
  <p>This is a placeholder. AI didn't generate specific HTML content.</p>
  
  <script src="script.js"></script>
</body>
</html>`;

  // Extract CSS code
  const cssMatch = text.match(/```css([\s\S]*?)```/i);
  const cssContent = cssMatch ? cssMatch[1].trim() : `body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  color: #333;
}

h1 {
  color: #2c3e50;
}`;

  // Extract JavaScript code
  const jsMatch = text.match(/```(?:javascript|js)([\s\S]*?)```/i);
  const jsContent = jsMatch ? jsMatch[1].trim() : `document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded successfully');
});`;

  return {
    htmlContent,
    cssContent,
    jsContent
  };
};

/**
 * Formats code with proper indentation
 * @param code The code to format
 * @param language The language of the code
 * @returns Formatted code string
 */
export const formatCode = (code: string, language: string): string => {
  if (!code) return '';
  
  // Basic formatting based on language
  switch (language) {
    case 'html':
      return formatHtml(code);
    case 'css':
      return formatCss(code);
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      return formatJs(code);
    default:
      return code;
  }
};

/**
 * Basic HTML formatter
 */
const formatHtml = (code: string): string => {
  // Simple indentation
  let formatted = '';
  let indentLevel = 0;
  const lines = code.split(/>\s*</g);
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Check if this line is a closing tag
    if (line.startsWith('/') && !line.includes(' ') && indentLevel > 0) {
      indentLevel--;
    }
    
    // Add proper indentation
    formatted += '  '.repeat(indentLevel) + (i === 0 ? line : '<' + line + '>') + '\n';
    
    // Check if this line is an opening tag and not self-closing
    if (!line.startsWith('/') && 
        !line.endsWith('/') && 
        !line.includes(' /') && 
        !line.match(/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s|>)/i)) {
      indentLevel++;
    }
  }
  
  return formatted;
};

/**
 * Basic CSS formatter
 */
const formatCss = (code: string): string => {
  // Split by closing braces
  const blocks = code.split('}');
  let formatted = '';
  
  for (let i = 0; i < blocks.length; i++) {
    if (!blocks[i].trim()) continue;
    
    // Add opening brace
    const parts = blocks[i].split('{');
    if (parts.length === 2) {
      formatted += parts[0].trim() + ' {\n';
      
      // Add properties with indentation
      const properties = parts[1].split(';');
      for (let prop of properties) {
        prop = prop.trim();
        if (prop) {
          formatted += '  ' + prop + ';\n';
        }
      }
      
      // Add closing brace
      formatted += '}\n\n';
    } else {
      // If malformed, just add as is
      formatted += blocks[i] + '}\n\n';
    }
  }
  
  return formatted;
};

/**
 * Basic JavaScript/TypeScript formatter
 */
const formatJs = (code: string): string => {
  // This is a very basic formatter
  let formatted = '';
  let indentLevel = 0;
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Decrease indent for closing braces
    if (trimmedLine.startsWith('}') || trimmedLine.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    // Add the line with proper indentation
    formatted += '  '.repeat(indentLevel) + trimmedLine + '\n';
    
    // Increase indent for opening braces
    if (trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || trimmedLine.endsWith('=>')) {
      indentLevel++;
    }
  }
  
  return formatted;
};

/**
 * Generates a path array for breadcrumb navigation
 * @param path Full file path
 * @returns Array of path segments
 */
export const getBreadcrumbsFromPath = (path: string): string[] => {
  if (!path) return [];
  return path.split('/').filter(p => p.trim() !== '');
};

/**
 * Returns the file extension without the dot
 * @param filename Filename with extension
 * @returns Extension string
 */
export const getFileExtension = (filename: string): string => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

/**
 * Gets the appropriate Monaco language based on file extension
 * @param filename Filename with extension
 * @returns Monaco language identifier
 */
export const getLanguageForFile = (filename: string): string => {
  const extension = getFileExtension(filename);
  
  // Map extensions to Monaco language identifiers
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'go': 'go',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'rb': 'ruby',
    'rs': 'rust',
    'php': 'php',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml'
  };
  
  return languageMap[extension] || 'plaintext';
};

/**
 * Counts lines of code in a file
 * @param content File content
 * @returns Number of lines
 */
export const countLinesOfCode = (content: string): number => {
  if (!content) return 0;
  return content.split('\n').length;
};

/**
 * Creates initial file structure for a new project
 * @returns Array of FileNode objects
 */
export const createInitialFileStructure = (): FileNode[] => {
  return [
    {
      id: 'root',
      name: 'Web Project',
      type: 'folder',
      children: [
        {
          id: 'index.html',
          name: 'index.html',
          type: 'file',
          extension: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Welcome to My Website</h1>
  <p>This is a starting template for your website.</p>
  
  <script src="script.js"></script>
</body>
</html>`
        },
        {
          id: 'styles.css',
          name: 'styles.css',
          type: 'file',
          extension: 'css',
          content: `body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
  color: #333;
}

h1 {
  color: #2c3e50;
}`
        },
        {
          id: 'script.js',
          name: 'script.js',
          type: 'file',
          extension: 'js',
          content: `document.addEventListener("DOMContentLoaded", function() {
  console.log("Website loaded successfully!");
});`
        }
      ]
    }
  ];
};

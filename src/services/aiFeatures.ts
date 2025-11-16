import { streamGenerateCode, ModelType } from './unified-api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CodeSelection {
  code: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export interface DiffPatch {
  original: string;
  modified: string;
  startLine: number;
  endLine: number;
  description: string;
}

export interface RefactorOptions {
  type: 'rename' | 'extract-method' | 'extract-variable' | 'inline' | 'optimize' | 'general';
  target?: string; // For rename operations
  preserveComments?: boolean;
  preserveFormatting?: boolean;
}

export interface TestGenerationOptions {
  framework?: 'pytest' | 'unittest' | 'jest' | 'mocha' | 'auto';
  includeEdgeCases?: boolean;
  includeMocks?: boolean;
  coverage?: 'basic' | 'comprehensive';
}

export interface ErrorContext {
  errorMessage: string;
  stackTrace?: string;
  code: string;
  language: string;
  lineNumber?: number;
}

export interface MultiFileEdit {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  diff: string;
  description: string;
}

export interface ProjectContext {
  files: Array<{ path: string; content: string; language: string }>;
  currentFile?: string;
  dependencies?: string[];
  framework?: string;
}

// ============================================================================
// AI CODE EDITING (MODIFY SELECTION)
// ============================================================================

export const modifyCodeSelection = async (
  selection: CodeSelection,
  instruction: string,
  language: string,
  modelType: ModelType,
  onProgress?: (chunk: string) => void
): Promise<DiffPatch> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert code editor. Modify the selected code according to the user's instruction.
    
IMPORTANT RULES:
- Only modify the selected code region
- Preserve the code structure and style
- Maintain proper indentation
- Keep variable names consistent unless asked to change them
- Return ONLY the modified code without explanations
- Do not add extra comments unless specifically requested`;

    const prompt = `Language: ${language}

Selected Code:
\`\`\`${language}
${selection.code}
\`\`\`

Instruction: ${instruction}

Return only the modified code that should replace the selection:`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => {
        // Extract code from response
        const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
        const modifiedCode = codeMatch ? codeMatch[1] : response.trim();

        resolve({
          original: selection.code,
          modified: modifiedCode,
          startLine: selection.startLine,
          endLine: selection.endLine,
          description: instruction
        });
      },
      (error) => reject(error)
    );
  });
};

// ============================================================================
// ASK ABOUT CODE
// ============================================================================

export const askAboutCode = async (
  question: string,
  codeContext: string,
  language: string,
  modelType: ModelType,
  projectContext?: ProjectContext,
  onProgress?: (chunk: string) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert code analyst and teacher. Answer questions about code clearly and concisely.
    
Provide:
- Clear, accurate explanations
- Relevant code examples when helpful
- Best practices and potential issues
- Suggestions for improvement when appropriate`;

    let contextInfo = `Current Code (${language}):\n\`\`\`${language}\n${codeContext}\n\`\`\`\n\n`;
    
    if (projectContext?.files && projectContext.files.length > 0) {
      contextInfo += `\nProject Files:\n`;
      projectContext.files.slice(0, 5).forEach(file => {
        contextInfo += `- ${file.path}\n`;
      });
    }

    const prompt = `${contextInfo}Question: ${question}`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => resolve(response),
      (error) => reject(error)
    );
  });
};

// ============================================================================
// FIX ERRORS AUTOMATICALLY
// ============================================================================

export const fixErrorAutomatically = async (
  errorContext: ErrorContext,
  modelType: ModelType,
  onProgress?: (chunk: string) => void
): Promise<DiffPatch> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert debugger. Analyze errors and provide precise fixes.
    
IMPORTANT:
- Identify the root cause of the error
- Provide a minimal fix that resolves the issue
- Preserve existing code structure
- Return only the fixed code without explanations
- Maintain code style and formatting`;

    const prompt = `Language: ${errorContext.language}

Error Message:
${errorContext.errorMessage}

${errorContext.stackTrace ? `Stack Trace:\n${errorContext.stackTrace}\n` : ''}

Code with Error:
\`\`\`${errorContext.language}
${errorContext.code}
\`\`\`

${errorContext.lineNumber ? `Error occurs around line ${errorContext.lineNumber}\n` : ''}

Provide the fixed code:`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => {
        const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
        const fixedCode = codeMatch ? codeMatch[1] : response.trim();

        resolve({
          original: errorContext.code,
          modified: fixedCode,
          startLine: errorContext.lineNumber || 1,
          endLine: errorContext.lineNumber || 1,
          description: `Fix: ${errorContext.errorMessage}`
        });
      },
      (error) => reject(error)
    );
  });
};

// ============================================================================
// REFACTOR CODE
// ============================================================================

export const refactorCode = async (
  code: string,
  language: string,
  options: RefactorOptions,
  modelType: ModelType,
  onProgress?: (chunk: string) => void
): Promise<DiffPatch> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert code refactoring assistant. Improve code while preserving functionality.
    
RULES:
- Maintain exact same behavior and logic
- Improve code quality, readability, and maintainability
- Follow language-specific best practices
- Preserve comments if requested
- Return only the refactored code`;

    let instruction = '';
    switch (options.type) {
      case 'rename':
        instruction = `Rename '${options.target}' to a more descriptive name`;
        break;
      case 'extract-method':
        instruction = 'Extract selected code into a well-named method/function';
        break;
      case 'extract-variable':
        instruction = 'Extract complex expressions into well-named variables';
        break;
      case 'inline':
        instruction = 'Inline unnecessary abstractions';
        break;
      case 'optimize':
        instruction = 'Optimize for performance and efficiency';
        break;
      default:
        instruction = 'Refactor to improve code quality and readability';
    }

    const prompt = `Language: ${language}

Code to Refactor:
\`\`\`${language}
${code}
\`\`\`

Refactoring Task: ${instruction}
${options.preserveComments ? 'Preserve all existing comments.' : ''}
${options.preserveFormatting ? 'Maintain current formatting style.' : ''}

Provide the refactored code:`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => {
        const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
        const refactoredCode = codeMatch ? codeMatch[1] : response.trim();

        resolve({
          original: code,
          modified: refactoredCode,
          startLine: 1,
          endLine: code.split('\n').length,
          description: `Refactor: ${instruction}`
        });
      },
      (error) => reject(error)
    );
  });
};

// ============================================================================
// GENERATE UNIT TESTS
// ============================================================================

export const generateUnitTests = async (
  code: string,
  language: string,
  options: TestGenerationOptions,
  modelType: ModelType,
  onProgress?: (chunk: string) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const framework = options.framework === 'auto'
      ? (language === 'python' ? 'pytest' : language === 'javascript' || language === 'typescript' ? 'jest' : 'unittest')
      : options.framework || 'pytest';

    const systemPrompt = `You are an expert test engineer. Generate comprehensive, well-structured unit tests.

REQUIREMENTS:
- Use ${framework} testing framework
- Include test cases for normal operation
${options.includeEdgeCases ? '- Include edge cases and boundary conditions' : ''}
${options.includeMocks ? '- Include mocks for external dependencies' : ''}
- Follow testing best practices
- Use descriptive test names
- Add comments explaining test scenarios`;

    const prompt = `Language: ${language}
Testing Framework: ${framework}

Code to Test:
\`\`\`${language}
${code}
\`\`\`

Generate ${options.coverage === 'comprehensive' ? 'comprehensive' : 'basic'} unit tests:`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => resolve(response),
      (error) => reject(error)
    );
  });
};

// ============================================================================
// EXPLAIN CODE
// ============================================================================

export const explainCode = async (
  code: string,
  language: string,
  modelType: ModelType,
  detailLevel: 'brief' | 'detailed' | 'comprehensive' = 'detailed',
  onProgress?: (chunk: string) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert code educator. Explain code clearly and thoroughly.

GUIDELINES:
- Start with a high-level overview
- Explain the purpose and functionality
- Break down complex logic step-by-step
- Highlight important patterns and techniques
- Mention potential issues or improvements
- Use clear, accessible language`;

    const detailInstructions = {
      brief: 'Provide a concise summary of what the code does.',
      detailed: 'Provide a detailed explanation including purpose, logic flow, and key components.',
      comprehensive: 'Provide a comprehensive analysis including purpose, detailed logic flow, design patterns, potential issues, and suggestions for improvement.'
    };

    const prompt = `Language: ${language}

Code to Explain:
\`\`\`${language}
${code}
\`\`\`

${detailInstructions[detailLevel]}`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => resolve(response),
      (error) => reject(error)
    );
  });
};

// ============================================================================
// GENERATE COMMENTS / DOCSTRINGS
// ============================================================================

export const generateDocumentation = async (
  code: string,
  language: string,
  modelType: ModelType,
  type: 'inline-comments' | 'docstrings' | 'both' = 'both',
  onProgress?: (chunk: string) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert technical writer. Generate clear, professional code documentation.

REQUIREMENTS:
- Follow language-specific documentation standards
- Be concise but informative
- Document parameters, return values, and exceptions
- Include usage examples for complex functions
- Use proper formatting for the language`;

    const docStyle = {
      python: 'Use Python docstrings (Google or NumPy style)',
      javascript: 'Use JSDoc format',
      typescript: 'Use TSDoc format',
      java: 'Use JavaDoc format',
      default: 'Use appropriate documentation format for the language'
    };

    const style = docStyle[language as keyof typeof docStyle] || docStyle.default;

    const typeInstructions = {
      'inline-comments': 'Add inline comments explaining complex logic',
      'docstrings': 'Add function/class documentation only',
      'both': 'Add both inline comments and function/class documentation'
    };

    const prompt = `Language: ${language}
Documentation Style: ${style}

Code to Document:
\`\`\`${language}
${code}
\`\`\`

Task: ${typeInstructions[type]}

Return the code with documentation added:`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => {
        // Extract code from response
        const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
        const documentedCode = codeMatch ? codeMatch[1] : response.trim();
        resolve(documentedCode);
      },
      (error) => reject(error)
    );
  });
};

// ============================================================================
// MULTI-FILE EDIT PLANNING
// ============================================================================

export const planMultiFileEdit = async (
  instruction: string,
  projectContext: ProjectContext,
  modelType: ModelType,
  onProgress?: (chunk: string) => void
): Promise<MultiFileEdit[]> => {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are an expert software architect. Plan and execute multi-file code changes.

REQUIREMENTS:
- Analyze the entire project context
- Identify all files that need changes
- Ensure changes are consistent across files
- Maintain code quality and style
- Provide clear descriptions of each change

OUTPUT FORMAT:
For each file that needs changes, provide:
FILE: <filepath>
DESCRIPTION: <what changes and why>
CODE:
\`\`\`
<modified file content>
\`\`\`
---`;

    let contextInfo = 'Project Files:\n';
    if (projectContext.files && projectContext.files.length > 0) {
      projectContext.files.forEach(file => {
        contextInfo += `\nFile: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`;
      });
    }

    if (projectContext.dependencies) {
      contextInfo += `\nDependencies: ${projectContext.dependencies.join(', ')}\n`;
    }

    if (projectContext.framework) {
      contextInfo += `Framework: ${projectContext.framework}\n`;
    }

    const prompt = `${contextInfo}

Instruction: ${instruction}

Plan and provide the necessary changes for all affected files:`;

    streamGenerateCode(
      prompt,
      modelType,
      systemPrompt,
      (chunk) => {
        if (onProgress) onProgress(chunk);
      },
      (response) => {
        // Parse the response to extract multi-file edits
        const edits: MultiFileEdit[] = [];
        const fileBlocks = response.split('---').filter(block => block.trim());

        fileBlocks.forEach(block => {
          const fileMatch = block.match(/FILE:\s*(.+)/);
          const descMatch = block.match(/DESCRIPTION:\s*(.+)/);
          const codeMatch = block.match(/CODE:\s*```[\w]*\n([\s\S]*?)\n```/);

          if (fileMatch && codeMatch) {
            const filePath = fileMatch[1].trim();
            const description = descMatch ? descMatch[1].trim() : 'Modified file';
            const modifiedContent = codeMatch[1];

            const originalFile = projectContext.files.find(f => f.path === filePath);
            const originalContent = originalFile?.content || '';

            edits.push({
              filePath,
              originalContent,
              modifiedContent,
              diff: generateSimpleDiff(originalContent, modifiedContent),
              description
            });
          }
        });

        resolve(edits);
      },
      (error) => reject(error)
    );
  });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSimpleDiff(original: string, modified: string): string {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  let diff = '';
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || '';
    const modLine = modifiedLines[i] || '';

    if (origLine !== modLine) {
      if (origLine) diff += `- ${origLine}\n`;
      if (modLine) diff += `+ ${modLine}\n`;
    } else {
      diff += `  ${origLine}\n`;
    }
  }

  return diff;
}

// ============================================================================
// CONTEXT SEARCH (for Chat with Project Context)
// ============================================================================

export const searchProjectContext = (
  query: string,
  projectContext: ProjectContext
): Array<{ path: string; content: string; relevance: number }> => {
  const results: Array<{ path: string; content: string; relevance: number }> = [];

  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  projectContext.files.forEach(file => {
    const contentLower = file.content.toLowerCase();
    const pathLower = file.path.toLowerCase();

    let relevance = 0;

    // Check if query terms appear in file
    queryTerms.forEach(term => {
      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      const pathMatches = (pathLower.match(new RegExp(term, 'g')) || []).length;

      relevance += contentMatches + (pathMatches * 5); // Path matches are more relevant
    });

    if (relevance > 0) {
      results.push({
        path: file.path,
        content: file.content,
        relevance
      });
    }
  });

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);

  return results;
};


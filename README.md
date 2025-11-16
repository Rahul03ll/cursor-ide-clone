# Python IDE - AI-Powered Python Development Environment

A powerful **desktop-only** application for Python development with AI-powered code generation, real-time execution, and intelligent code assistance. Built with Electron for cross-platform desktop support.

## Features

### Core IDE Features
- **Live Code Editor**: Monaco Editor with syntax highlighting for multiple languages
- **Real-time Preview**: Execute Python code and see results instantly
- **File Explorer**: Navigate projects with full file management
- **Dark/Light Mode**: Toggle between dark and light themes
- **Terminal Integration**: Built-in terminal support
- **Git Integration**: Git panel for version control
- **Responsive UI**: Modern interface optimized for development

### AI-Powered Features (Cursor-like)
- ✅ **AI Code Editing (Modify Selection)**: Select code and describe changes - AI rewrites it
- ✅ **Inline Suggestions / Ghost Text**: Autocomplete-style AI suggestions as you type
- ✅ **Ask About Code**: Natural language Q&A about your codebase
- ✅ **Fix Errors Automatically**: AI analyzes errors and proposes fixes
- ✅ **Refactor Code**: High-level refactoring (rename, extract, optimize)
- ✅ **Generate Unit Tests**: Automatic test generation with edge cases
- ✅ **Explain Code**: Natural language explanations of code logic
- ✅ **Generate Comments/Docstrings**: Auto-generate documentation
- ✅ **Chat with Project Context**: AI chat that understands your entire project
- ✅ **Multi-file Edit Planning**: Plan and preview changes across multiple files

See [AI_FEATURES.md](AI_FEATURES.md) for detailed documentation of all AI features.

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Python 3.8+ (for code execution)
- Google Gemini API key (FREE - for AI features)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd python-ide
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with your Gemini API key
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key
4. Add it to your `.env` file as shown above

**Note**: The Gemini API is free to use with generous limits. No credit card required!

## Running the Application

### Development Mode (Desktop Application)

```bash
npm run dev
```

This will start the React development server and launch the Electron desktop application.

**Note**: This is a desktop-only application. It cannot run in a web browser.

### Building for Production

Build the desktop application installer:

```bash
npm run build-app
```

This will create platform-specific installers (Windows: NSIS, Mac: DMG, Linux: AppImage) in the `dist` folder.

## Usage

### Basic Workflow
1. **Open/Create Files**: Use the file explorer to navigate your project
2. **Edit Code**: Write code in the Monaco editor with syntax highlighting
3. **Run Code**: Execute Python code and see results in the preview panel
4. **Use AI Features**: Access AI tools via the toolbar and chat panel

### AI Features Quick Start

#### AI Code Editing
1. Select code in the editor
2. Click "AI Edit" or press Ctrl+K
3. Describe your changes
4. Review diff and apply

#### AI Chat
1. Click the robot icon or press Ctrl+/
2. Enable "Search project files" for project-wide context
3. Ask questions about your code
4. Get intelligent, context-aware answers

#### AI Toolbar
Use the toolbar buttons for quick access to:
- **Explain**: Understand what code does
- **Fix Error**: Automatically fix errors
- **Refactor**: Improve code structure
- **Generate Tests**: Create unit tests
- **Add Docs**: Generate documentation

#### Multi-File Editing
1. Click the multi-file edit button
2. Describe changes across your project
3. Review diffs for all affected files
4. Apply all changes at once

## Example AI Prompts

### Code Generation
- "Create a function to calculate the factorial of a number"
- "Write a Python class for managing a todo list"
- "Generate a Flask API endpoint for user authentication"

### Code Modification
- "Add error handling to this function"
- "Optimize this loop for better performance"
- "Convert this to use async/await"

### Questions
- "How does authentication work in this project?"
- "What does this function do?"
- "Where are the API endpoints defined?"

### Refactoring
- "Extract this logic into a separate function"
- "Rename this variable to be more descriptive"
- "Add type hints to all functions"

## Technologies Used

- React for the UI framework
- Electron for desktop application
- Monaco Editor for the code editor component
- Tailwind CSS for styling
- AI/ML API for accessing AI models
- React Resizable Panels for the split panel interface

## API Integration

This project uses the AI/ML API to access various AI models. The API provides a unified interface for accessing models like Claude, GPT, and others.

## Project Structure

```
python-ide/
├── public/
│   └── electron.js          # Electron main process
├── src/
│   ├── components/
│   │   ├── IDELayout.tsx    # Main IDE layout
│   │   ├── PythonPreview.tsx # Python execution preview
│   │   ├── CursorChatPanel.tsx # AI chat interface
│   │   └── ...
│   ├── services/
│   │   └── api.ts           # AI API integration
│   └── context/
│       └── ProjectContext.tsx # Project state management
└── package.json
```

## License

This project is licensed under the MIT License.

# ⚡ Cursor IDE Clone — AI-Powered Desktop Python IDE

[![Electron](https://img.shields.io/badge/Electron-39.1-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0.45-1E1E1E?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-88_Passed-success?style=for-the-badge)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **A high-performance cross-platform desktop code editor engineered for Python, featuring Microsoft Monaco Editor, native subprocess execution, inline ghost-text completions, selection-based code rewriting, and contextual AI chat.**

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELECTRON DESKTOP RUNTIME                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ MAIN PROCESS (Node.js)                                                │  │
│  │  • BrowserWindow Lifecycle & Window State Management                  │  │
│  │  • Native File System Access (read, write, list, watch)               │  │
│  │  • Python Execution Subprocess (spawn python child_process)           │  │
│  │  • Native OS Menu, Dialogs, and Clipboard Integration                 │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │ IPC Bridge (contextBridge / preload)  │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │ RENDERER PROCESS (React 18 + TypeScript SPA)                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Monaco Code Editor                                              │  │  │
│  │  │  • Python Syntax Highlighting, Autocomplete, Diagnostics        │  │  │
│  │  │  • Inline Ghost-Text AI Completions                             │  │  │
│  │  │  • Selection Diff & In-Place Code Transformation (Ctrl+K)      │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────┬───────────────────────────────────────┐  │  │
│  │  │ Workspace & File Tree   │ Integrated Terminal & Python Output   │  │  │
│  │  │  • Project Explorer     │  • Real-time stdout/stderr streaming  │  │  │
│  │  │  • Multi-Tab Buffer     │  • Exit code detection & error trace  │  │  │
│  │  └─────────────────────────┴───────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ AI Service Layer (Unified Provider Interface)                   │  │  │
│  │  │  • Google Gemini 2.0 Flash (Free default)                       │  │  │
│  │  │  • OpenAI GPT-4o / GPT-4o-mini & OpenRouter Alternative         │  │  │
│  │  │  • Project Context Search & Multi-File Edit Planner             │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🖥️ Core IDE Capabilities
- **Monaco Code Editor**: Full VS Code editing experience with Python syntax highlighting, bracket matching, folding, and multi-cursor support.
- **Native Python Execution**: Execute scripts in real-time via background child processes with streamed terminal output.
- **Enhanced File Explorer**: Interactive project tree with inline file/folder creation, renaming, deletion, and context menus.
- **Tabbed Workspace**: Multi-file editing with dirty state indicators and auto-save protection.
- **Dark & Light Themes**: Developer-tuned modern dark/light themes powered by Tailwind CSS.

### 🤖 Cursor-Inspired AI Features
- ⚡ **Inline Ghost-Text Suggestions**: Non-intrusive gray autocomplete suggestions as you type code, accepted via `Tab`.
- ✏️ **Selection Rewrite (Ctrl+K / Cmd+K)**: Highlight any code snippet, type an instruction (e.g. *"vectorize this loop using numpy"*), and review the diff.
- 💬 **Context-Aware AI Chat**: Ask questions about your active file or entire project with automatic context injection.
- 🐛 **One-Click Error Auto-Fix**: Inspect Python tracebacks with automated root-cause analysis and proposed patches.
- 🧪 **Unit Test Generator**: Automatically generate comprehensive test cases including boundary and edge cases.
- 📚 **Docstring & Comment Synthesizer**: Generate Google, NumPy, or Sphinx docstrings in one click.
- 🗺️ **Multi-File Edit Planner**: Plan cross-file refactors with dependency and impact analysis before applying changes.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: v3.8+ (accessible via `python` or `py` on your PATH)
- **AI API Key**: Free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (or OpenAI/OpenRouter key)

### 2. Installation

```bash
# 1. Clone the repository
git clone https://github.com/Rahul03ll/cursor-ide-clone.git
cd cursor-ide-clone

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

Edit `.env` with your API key:
```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_DEFAULT_MODEL=gemini
```

### 3. Running the App

```bash
# Launch Electron Desktop Application in development mode
npm run dev

# Or run in browser mode (with localStorage fallback storage)
npm start
```

---

## 🧪 Testing & Quality Assurance

The codebase includes an extensive Jest unit test suite covering DOM APIs, local storage fallbacks, code extraction utilities, and AI orchestration.

```bash
# Run all unit tests
npx jest --config jest.config.js

# Type-check TypeScript codebase
npx tsc --noEmit
```

**Test Suite Coverage**:
- `src/App.test.tsx`: Component rendering and layout sanity checks (6 passed)
- `src/services/__tests__/storageService.test.ts`: Local and Electron file storage, autosave, and multi-file ops (22 passed)
- `src/services/__tests__/aiFeatures.test.ts`: AI selection modification, Q&A, refactoring, and context ranking (19 passed)
- `src/services/__tests__/gemini-api.test.ts`: Gemini streaming, code generation, error boundaries (13 passed)
- `src/utils/__tests__/codeUtils.test.ts`: Markdown code extraction, line counts, language mapping (28 passed)
- **Total: 88 passed across 5 suites (100% pass rate)**

---

## 📦 Packaging & Desktop Distribution

Build standalone installers for your platform using `electron-builder`:

```bash
# Build React bundle and package desktop binary (Windows .exe, macOS .dmg, Linux .AppImage)
npm run electron:pack
```

---

## 👨‍💻 Author & Contact

**Rahul Roy**  
*Final-Year B.Tech CSE @ KIIT University | SDE & Systems/AI Engineer*  
- 🌐 **GitHub**: [@Rahul03ll](https://github.com/Rahul03ll)
- 🔗 **LinkedIn**: [linkedin.com/in/rahul-roy-362a12256](https://linkedin.com/in/rahul-roy-362a12256)
- 📧 **Email**: [rahulroy2259@gmail.com](mailto:rahulroy2259@gmail.com)

---

⭐ If you find this project useful, give it a star on [GitHub](https://github.com/Rahul03ll/cursor-ide-clone)!

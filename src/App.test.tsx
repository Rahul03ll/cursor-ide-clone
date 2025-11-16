import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import MainMenuBar from "./components/MainMenuBar";
import IDELayout from "./components/IDELayout";
import EnhancedFileExplorer from "./components/EnhancedFileExplorer";
import CursorChatPanel from "./components/CursorChatPanel";
import PythonPreview from "./components/PythonPreview";

// Mock the Monaco Editor as it's not needed for this test
jest.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: () => <div data-testid="monaco-editor" />,
}));

// Mock the ErrorBoundary component to avoid error boundary issues in tests
jest.mock("./components/ErrorBoundary", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// Mock the ThemeContext with default values
jest.mock("./context/ThemeContext", () => ({
  __esModule: true,
  useTheme: () => ({
    theme: "dark",
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Mock the ProjectContext with default values
jest.mock("./context/ProjectContext", () => ({
  __esModule: true,
  useProject: () => ({
    currentFile: null,
    setCurrentFile: jest.fn(),
    updateFileContent: jest.fn(),
    rootNode: { name: "root", type: "directory", children: [] },
  }),
  ProjectProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-provider">{children}</div>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  test("renders the main application", () => {
    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    // Check if the app renders without crashing
    const appElement = screen.getByTestId("app");
    expect(appElement).toBeInTheDocument();
  });

  test("renders the MainMenuBar component", () => {
    render(<MainMenuBar />);
    const menuBarElement = screen.getByRole("banner");
    expect(menuBarElement).toBeInTheDocument();
  });

  test("renders the IDELayout component", () => {
    render(<IDELayout />);
    const ideLayoutElement = screen.getByTestId("ide-layout");
    expect(ideLayoutElement).toBeInTheDocument();
  });

  test("renders the EnhancedFileExplorer component", () => {
    render(
      <EnhancedFileExplorer
        rootNode={{ id: "root", name: "root", type: "folder", children: [] }}
        onSelectFile={() => {}}
      />,
    );
    const fileExplorerElement = screen.getByText("Files");
    expect(fileExplorerElement).toBeInTheDocument();
  });

  test("renders the CursorChatPanel component", () => {
    render(
      <CursorChatPanel
        onClose={() => {}}
        onSubmit={() => Promise.resolve("")}
        modelType="gemini"
      />,
    );
    const chatPanelElement = screen.getByText("AI Chat");
    expect(chatPanelElement).toBeInTheDocument();
  });

  test("renders the PythonPreview component", () => {
    render(<PythonPreview code="" />);
    const pythonPreviewElement = screen.getByText("Python Output");
    expect(pythonPreviewElement).toBeInTheDocument();
  });
});

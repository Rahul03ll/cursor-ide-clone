import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ProjectProvider } from "./context/ProjectContext";
import MainMenuBar from "./components/MainMenuBar";
import IDELayout from "./components/IDELayout";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const handleTerminalAction = () => {
    console.log("Terminal action");
  };

  const handleFileAction = (action: string) => {
    console.log("File action:", action);
  };

  const handleEditAction = (action: string) => {
    console.log("Edit action:", action);
  };

  const handleViewAction = (action: string) => {
    if (action === "command-palette") {
      setShowCommandPalette(true);
    }
  };

  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("Global error caught:", error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <ThemeProvider>
        <ProjectProvider>
          <div className="app">
            <MainMenuBar
              onFileAction={handleFileAction}
              onEditAction={handleEditAction}
              onViewAction={handleViewAction}
              onTerminalAction={handleTerminalAction}
            />
            <IDELayout
              showCommandPalette={showCommandPalette}
              setShowCommandPalette={setShowCommandPalette}
            />
          </div>
        </ProjectProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

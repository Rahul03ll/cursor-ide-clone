/// <reference types="react-scripts" />

// Extend Window interface for Electron
interface Window {
  require?: NodeRequire;
}

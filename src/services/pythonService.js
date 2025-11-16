// Check if running in Electron or browser
const isElectron = () => {
  return typeof window !== "undefined" && window.electron && window.electron.ipcRenderer;
};

export const executePython = async (code) => {
  // If not in Electron, use browser-based Python execution (Pyodide or API)
  if (!isElectron()) {
    console.log('Running in browser mode - using web-based Python execution');
    try {
      // For now, return a message indicating browser mode
      // In production, you could use Pyodide or a Python API
      return {
        output: '# Browser mode: Python execution requires Electron desktop app\n# Or configure a Python execution API endpoint',
        error: null,
        executionTime: 0
      };
    } catch (error) {
      return { output: null, error: error.message, executionTime: 0 };
    }
  }

  // Electron mode - use IPC
  try {
    const result = await window.electron.ipcRenderer.invoke('execute-python', code);
    return result;
  } catch (error) {
    console.error('Error executing Python:', error);
    return { output: null, error: error.message, executionTime: 0 };
  }
};

export const onPythonOutput = (callback) => {
  if (!isElectron()) return () => {};

  const handler = (event, ...args) => callback(...args);
  window.electron.ipcRenderer.on('python-output', handler);

  // Return cleanup function
  return () => {
    window.electron.ipcRenderer.off('python-output', handler);
  };
};

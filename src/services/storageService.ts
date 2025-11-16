// Storage Service - Save and load code files in Electron app

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}

export interface SavedFile {
  name: string;
  size: number;
  modified: Date;
  path: string;
}

export interface StorageResult {
  success: boolean;
  error?: string;
  path?: string;
  code?: string;
  fileName?: string;
  files?: SavedFile[];
  canceled?: boolean;
}

// Check if running in Electron
export const isElectron = (): boolean => {
  return !!(window.electron && window.electron.ipcRenderer);
};

// Save code file to app storage
export const saveCodeFile = async (fileName: string, code: string): Promise<StorageResult> => {
  if (!isElectron()) {
    console.warn('Not running in Electron - using localStorage fallback');
    try {
      localStorage.setItem(`code_${fileName}`, code);
      return { success: true, path: `localStorage:${fileName}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  try {
    const result = await window.electron!.ipcRenderer.invoke('save-code-file', fileName, code);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Load code file from app storage
export const loadCodeFile = async (fileName: string): Promise<StorageResult> => {
  if (!isElectron()) {
    console.warn('Not running in Electron - using localStorage fallback');
    try {
      const code = localStorage.getItem(`code_${fileName}`);
      if (code) {
        return { success: true, code };
      }
      return { success: false, error: 'File not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  try {
    const result = await window.electron!.ipcRenderer.invoke('load-code-file', fileName);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// List all saved code files
export const listCodeFiles = async (): Promise<StorageResult> => {
  if (!isElectron()) {
    console.warn('Not running in Electron - using localStorage fallback');
    try {
      const files: SavedFile[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('code_')) {
          const fileName = key.substring(5);
          const code = localStorage.getItem(key) || '';
          files.push({
            name: fileName,
            size: code.length,
            modified: new Date(),
            path: `localStorage:${fileName}`
          });
        }
      }
      return { success: true, files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  try {
    const result = await window.electron!.ipcRenderer.invoke('list-code-files');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete code file
export const deleteCodeFile = async (fileName: string): Promise<StorageResult> => {
  if (!isElectron()) {
    console.warn('Not running in Electron - using localStorage fallback');
    try {
      localStorage.removeItem(`code_${fileName}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  try {
    const result = await window.electron!.ipcRenderer.invoke('delete-code-file', fileName);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Save code file with dialog (user chooses location)
export const saveCodeFileDialog = async (defaultName: string, code: string): Promise<StorageResult> => {
  if (!isElectron()) {
    console.warn('Not running in Electron - file dialog not available');
    // Fallback to download
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, path: defaultName };
  }
  
  try {
    const result = await window.electron!.ipcRenderer.invoke('save-code-file-dialog', defaultName, code);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Open code file with dialog
export const openCodeFileDialog = async (): Promise<StorageResult> => {
  if (!isElectron()) {
    console.warn('Not running in Electron - file dialog not available');
    return { success: false, error: 'File dialog only available in desktop app' };
  }
  
  try {
    const result = await window.electron!.ipcRenderer.invoke('open-code-file-dialog');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auto-save current code (saves to a special auto-save file)
export const autoSaveCode = async (code: string): Promise<StorageResult> => {
  const autoSaveFileName = '_autosave.py';
  return saveCodeFile(autoSaveFileName, code);
};

// Load auto-saved code
export const loadAutoSavedCode = async (): Promise<StorageResult> => {
  const autoSaveFileName = '_autosave.py';
  return loadCodeFile(autoSaveFileName);
};

// Export all functions
export default {
  saveCodeFile,
  loadCodeFile,
  listCodeFiles,
  deleteCodeFile,
  saveCodeFileDialog,
  openCodeFileDialog,
  autoSaveCode,
  loadAutoSavedCode,
  isElectron
};


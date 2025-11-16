// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // IPC Renderer for Python execution and file storage
  ipcRenderer: {
    invoke: (channel, ...args) => {
      const validChannels = [
        'execute-python',
        'save-code-file',
        'load-code-file',
        'list-code-files',
        'delete-code-file',
        'save-code-file-dialog',
        'open-code-file-dialog'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },

    on: (channel, listener) => {
      const validChannels = ['python-output'];
      if (validChannels.includes(channel)) {
        const subscription = (event, ...args) => listener(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      }
      return () => {};
    },

    off: (channel, listener) => {
      const validChannels = ['python-output'];
      if (validChannels.includes(channel)) {
        ipcRenderer.off(channel, listener);
      }
    },

    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

// Log that preload script has loaded
console.log('✅ Preload script loaded successfully');
console.log('📁 File storage enabled');

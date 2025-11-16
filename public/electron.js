const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const isDev = require("electron-is-dev");

// Add this at the top of your file
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1"; // Only for development

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: "Python IDE - AI-Powered Python Development",
    webPreferences: {
      nodeIntegration: false, // Disable node integration for security
      contextIsolation: true, // Keep context isolation enabled
      enableRemoteModule: false, // Keep remote module disabled
      webSecurity: true, // Always enable web security
      nodeIntegrationInWorker: false, // Disable node in workers for security
      sandbox: true, // Enable sandbox for better security
      preload: path.join(__dirname, "preload.js"), // Preload script for secure IPC
    },
    icon: path.join(__dirname, "logo512.png"),
    titleBarStyle: "default",
    show: false,
  });

      // Set up CSP for all environments
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const csp = [
        "default-src 'self' file: http: https: data: blob: 'unsafe-eval' 'unsafe-inline';",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net file: http: https:;",
        "style-src 'self' 'unsafe-inline' https: file:;",
        "img-src 'self' data: https: file: blob:;",
        "font-src 'self' https: data: file:;",
        `connect-src 'self' https://api.aimlapi.com https://*.openai.com https://*.openai.azure.com ws: http: https: ${isDev ? "ws://localhost:3001" : ""};`,
        "worker-src 'self' blob: file:;",
        "frame-src 'self' file:;",
        "media-src 'self' file:;",
        "object-src 'none'",
      ].join(" ");      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [csp],
        },
      });
    },
  );

  // Load the app
  const startUrl = isDev
    ? "http://localhost:3001"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    app.quit();
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Helper function to find Python command
// TODO: Add a setting to allow the user to configure the path to the Python executable.
const findPythonCommand = () => {
  const { execSync } = require("child_process");
  const pythonCommands =
    process.platform === "win32"
      ? ["python", "python3", "py"]
      : ["python3", "python"];

  for (const cmd of pythonCommands) {
    try {
      execSync(`${cmd} --version`, { stdio: "ignore", timeout: 2000 });
      return cmd;
    } catch (e) {
      continue;
    }
  }
  return null;
};

// Helper function to safely clean up temporary files
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Error deleting temp file:", err);
  }
};

// Python execution handler
// WARNING: This handler executes Python code from the user.
// While it uses a temporary file, it's still a potential security risk.
// For a production application, consider using a sandboxed execution environment.
ipcMain.handle("execute-python", async (event, code) => {
  return new Promise((resolve) => {
    // Validate code length
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return resolve({ output: "", error: "No code provided" });
    }

    console.log(
      "Received Python code to execute:",
      code.substring(0, 100) + "...",
    );

    // Find Python command
    const pythonCmd = findPythonCommand();
    if (!pythonCmd) {
      resolve({
        output: null,
        error:
          "Python is not installed or not available in PATH. Please install Python 3.8+ and ensure it is in your system PATH.",
        executionTime: 0,
      });
      return;
    }

    // Create a temporary Python file
    const tempDir = os.tmpdir();
    const tempFile = path.join(
      tempDir,
      `python_exec_${Date.now()}_${Math.random().toString(36).substring(7)}.py`,
    );

    // Write code to temporary file
    try {
      fs.writeFileSync(tempFile, code, "utf8");
    } catch (err) {
      resolve({
        output: null,
        error: `Failed to create temporary file: ${err.message}`,
        executionTime: 0,
      });
      return;
    }

    // TODO: Add a way to manage Python dependencies (e.g., using a virtual environment).
    // Spawn Python process
    const pythonProcess = spawn(pythonCmd, [tempFile], {
      cwd: tempDir,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";
    const startTime = Date.now();
    let resolved = false; // Prevent multiple resolves

    // Safe resolve function
    const safeResolve = (result) => {
      if (!resolved) {
        resolved = true;
        cleanupTempFile(tempFile);
        resolve(result);
      }
    };

    // Collect stdout
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Set a timeout (30 seconds) with proper cleanup
    const timeoutId = setTimeout(() => {
      if (!pythonProcess.killed && !resolved) {
        pythonProcess.kill("SIGTERM");
        // Give it a moment to clean up
        setTimeout(() => {
          if (!pythonProcess.killed) {
            pythonProcess.kill("SIGKILL");
          }
        }, 1000);

        const executionTime = Date.now() - startTime;
        safeResolve({
          output: stdout || null,
          error: "Execution timeout (30 seconds exceeded)",
          executionTime,
        });
      }
    }, 30000);

    // Handle process completion
    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId); // Clear timeout on completion
      const executionTime = Date.now() - startTime;

      safeResolve({
        output: stdout || null,
        error: code !== 0 ? stderr || `Process exited with code ${code}` : null,
        executionTime,
      });
    });

    // Handle process errors
    pythonProcess.on("error", (error) => {
      clearTimeout(timeoutId); // Clear timeout on error
      const executionTime = Date.now() - startTime;

      safeResolve({
        output: null,
        error: `Failed to execute Python: ${error.message}. Make sure Python is installed and available in your PATH.`,
        executionTime,
      });
    });
  });
});

// ============================================================================
// FILE STORAGE HANDLERS - Save and load code files
// ============================================================================

// Get app data directory for storing code files
const getAppDataPath = () => {
  const userDataPath = app.getPath('userData');
  const codeStoragePath = path.join(userDataPath, 'code-storage');

  // Create directory if it doesn't exist
  if (!fs.existsSync(codeStoragePath)) {
    fs.mkdirSync(codeStoragePath, { recursive: true });
  }

  return codeStoragePath;
};

// Save code file
ipcMain.handle('save-code-file', async (event, fileName, code) => {
  try {
    const storagePath = getAppDataPath();
    const filePath = path.join(storagePath, fileName);

    fs.writeFileSync(filePath, code, 'utf8');

    console.log('✅ Code saved:', filePath);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Error saving code:', error);
    return { success: false, error: error.message };
  }
});

// Load code file
ipcMain.handle('load-code-file', async (event, fileName) => {
  try {
    const storagePath = getAppDataPath();
    const filePath = path.join(storagePath, fileName);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const code = fs.readFileSync(filePath, 'utf8');

    console.log('✅ Code loaded:', filePath);
    return { success: true, code };
  } catch (error) {
    console.error('❌ Error loading code:', error);
    return { success: false, error: error.message };
  }
});

// List all saved code files
ipcMain.handle('list-code-files', async () => {
  try {
    const storagePath = getAppDataPath();
    const files = fs.readdirSync(storagePath);

    const fileList = files.map(fileName => {
      const filePath = path.join(storagePath, fileName);
      const stats = fs.statSync(filePath);

      return {
        name: fileName,
        size: stats.size,
        modified: stats.mtime,
        path: filePath
      };
    });

    console.log(`✅ Found ${fileList.length} saved files`);
    return { success: true, files: fileList };
  } catch (error) {
    console.error('❌ Error listing files:', error);
    return { success: false, error: error.message };
  }
});

// Delete code file
ipcMain.handle('delete-code-file', async (event, fileName) => {
  try {
    const storagePath = getAppDataPath();
    const filePath = path.join(storagePath, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Code deleted:', filePath);
      return { success: true };
    }

    return { success: false, error: 'File not found' };
  } catch (error) {
    console.error('❌ Error deleting code:', error);
    return { success: false, error: error.message };
  }
});

// Save code file with dialog (user chooses location)
ipcMain.handle('save-code-file-dialog', async (event, defaultName, code) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save Code File',
      defaultPath: defaultName,
      filters: [
        { name: 'Python Files', extensions: ['py'] },
        { name: 'JavaScript Files', extensions: ['js', 'jsx', 'ts', 'tsx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(result.filePath, code, 'utf8');

    console.log('✅ Code saved to:', result.filePath);
    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('❌ Error saving code:', error);
    return { success: false, error: error.message };
  }
});

// Open code file with dialog
ipcMain.handle('open-code-file-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Open Code File',
      filters: [
        { name: 'Python Files', extensions: ['py'] },
        { name: 'JavaScript Files', extensions: ['js', 'jsx', 'ts', 'tsx'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    const code = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    console.log('✅ Code loaded from:', filePath);
    return { success: true, code, fileName, path: filePath };
  } catch (error) {
    console.error('❌ Error opening code:', error);
    return { success: false, error: error.message };
  }
});

console.log('📁 Code storage directory:', getAppDataPath());

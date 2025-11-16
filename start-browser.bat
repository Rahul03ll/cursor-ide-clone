@echo off
echo ========================================
echo Starting Python IDE in Browser Mode
echo ========================================
echo.
echo Checking Ollama...
node test-ollama.js
echo.
echo Starting browser mode...
echo Open: http://localhost:3000
echo.
echo Note: Python execution won't work in browser mode
echo Use 'start-app.bat' for full desktop app with Python support
echo.
echo Press Ctrl+C to stop the server
echo.
npm start


"""
Python IDE Backend - Gemini API Integration
This backend supports the AI-powered Python IDE with Google Gemini API integration.
"""

import os
import sys
import json
import subprocess
from typing import Dict, Any, Optional

def check_python_environment():
    """
    Check if Python environment is properly configured
    Returns:
        Dict with environment status
    """
    try:
        python_version = sys.version_info
        return {
            "status": "ready",
            "version": f"{python_version.major}.{python_version.minor}.{python_version.micro}",
            "executable": sys.executable,
            "path": sys.path[:3]  # First 3 paths to avoid too much output
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def execute_python_code(code: str, timeout: int = 30) -> Dict[str, Any]:
    """
    Execute Python code safely and return results
    Args:
        code: Python code to execute
        timeout: Execution timeout in seconds
    Returns:
        Dict with execution results
    """
    try:
        # Create a temporary file for execution
        with open('temp_execution.py', 'w', encoding='utf-8') as f:
            f.write(code)
        
        # Execute the code with timeout
        result = subprocess.run(
            [sys.executable, 'temp_execution.py'],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        # Clean up
        os.remove('temp_execution.py')
        
        return {
            "status": "success",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
        
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "error": "Execution timed out"
        }
    except Exception as e:
        return {
            "status": "error", 
            "error": str(e)
        }

def check_gemini_api_status():
    """
    Check if Gemini API is configured
    Returns:
        Dict with API configuration status
    """
    api_key = os.getenv('REACT_APP_GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
    
    if api_key:
        # Mask the API key for security
        masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
        return {
            "status": "configured",
            "api_key": masked_key,
            "endpoint": "https://generativelanguage.googleapis.com/v1beta",
            "model": "gemini-2.0-flash"
        }
    else:
        return {
            "status": "not_configured",
            "message": "Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY environment variable."
        }

def get_project_status():
    """
    Get overall project status
    Returns:
        Dict with project information
    """
    return {
        "name": "AI-Powered Python IDE",
        "version": "1.0.0",
        "api_provider": "Google Gemini",
        "features": [
            "AI code generation with Gemini 2.0 Flash",
            "Real-time code execution",
            "AI chat interface",
            "File management",
            "Syntax highlighting with Monaco Editor",
            "Electron desktop support"
        ],
        "requirements": [
            "Python 3.8+",
            "Node.js 16+", 
            "Google Gemini API key (free)"
        ]
    }

def main():
    """
    Main function to demonstrate backend capabilities
    """
    print("🐍 AI-Powered Python IDE Backend")
    print("=" * 40)
    
    # Check Python environment
    print("\n📋 Python Environment Status:")
    env_status = check_python_environment()
    print(f"   Status: {env_status['status']}")
    if env_status['status'] == 'ready':
        print(f"   Version: {env_status['version']}")
        print(f"   Executable: {env_status['executable']}")
    
    # Check Gemini API configuration
    print("\n🤖 Gemini API Status:")
    api_status = check_gemini_api_status()
    print(f"   Status: {api_status['status']}")
    if api_status['status'] == 'configured':
        print(f"   API Key: {api_status['api_key']}")
        print(f"   Model: {api_status['model']}")
    else:
        print(f"   Message: {api_status['message']}")
    
    # Show project information
    print("\n📁 Project Information:")
    project_info = get_project_status()
    print(f"   Name: {project_info['name']}")
    print(f"   Version: {project_info['version']}")
    print(f"   API Provider: {project_info['api_provider']}")
    print("   Features:")
    for feature in project_info['features']:
        print(f"     • {feature}")
    
    print("\n✅ Backend is ready to support the AI Python IDE!")
    print("\n💡 To get started:")
    print("   1. Get a free Gemini API key: https://aistudio.google.com/app/apikey")
    print("   2. Set REACT_APP_GEMINI_API_KEY in your .env file")
    print("   3. Run 'npm start' to launch the IDE")

if __name__ == "__main__":
    main()
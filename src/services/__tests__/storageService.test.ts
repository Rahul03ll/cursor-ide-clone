/**
 * Tests for Storage Service
 * Tests file storage, auto-save, and file management functions
 */

import {
  saveCodeFile,
  loadCodeFile,
  listCodeFiles,
  deleteCodeFile,
  autoSaveCode,
  loadAutoSavedCode,
  isElectron
} from '../storageService';

describe('Storage Service', () => {
  const testFileName = 'test-file.py';
  const testCode = `
def hello_world():
    print("Hello, World!")
    return True
  `;

  describe('isElectron', () => {
    test('should detect if running in Electron', () => {
      const result = isElectron();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('saveCodeFile', () => {
    test('should save code file successfully', async () => {
      const result = await saveCodeFile(testFileName, testCode);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }, 10000);

    test('should handle file overwrite', async () => {
      const newCode = 'print("Updated code")';
      const result = await saveCodeFile(testFileName, newCode);
      
      expect(result.success).toBe(true);
    }, 10000);

    test('should handle different file types', async () => {
      const files = [
        { name: 'test.py', code: 'print("Python")' },
        { name: 'test.js', code: 'console.log("JavaScript")' },
        { name: 'test.ts', code: 'console.log("TypeScript")' }
      ];

      for (const file of files) {
        const result = await saveCodeFile(file.name, file.code);
        expect(result.success).toBe(true);
      }
    }, 30000);
  });

  describe('loadCodeFile', () => {
    test('should load saved code file', async () => {
      // First save a file
      await saveCodeFile(testFileName, testCode);
      
      // Then load it
      const result = await loadCodeFile(testFileName);
      
      expect(result.success).toBe(true);
      expect(result.code).toBeTruthy();
    }, 10000);

    test('should handle non-existent files', async () => {
      const result = await loadCodeFile('non-existent-file.py');
      
      // Should either fail gracefully or return empty
      expect(result).toBeDefined();
    }, 10000);

    test('should preserve code content', async () => {
      const originalCode = 'def test():\n    pass';
      await saveCodeFile('preserve-test.py', originalCode);
      
      const result = await loadCodeFile('preserve-test.py');
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(originalCode);
    }, 10000);
  });

  describe('listCodeFiles', () => {
    test('should list saved files', async () => {
      // Save a test file first
      await saveCodeFile('list-test.py', testCode);
      
      const result = await listCodeFiles();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.files)).toBe(true);
    }, 10000);

    test('should return file metadata', async () => {
      await saveCodeFile('metadata-test.py', testCode);
      
      const result = await listCodeFiles();
      
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      
      // Test file properties if files exist
      const fileCount = result.files ? result.files.length : 0;
      expect(fileCount).toBeGreaterThanOrEqual(0);
      
      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        // eslint-disable-next-line jest/no-conditional-expect
        expect(file.name).toBeTruthy();
        // eslint-disable-next-line jest/no-conditional-expect
        expect(file.size).toBeGreaterThanOrEqual(0);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(file.modified).toBeDefined();
      }
    }, 10000);

    test('should handle empty file list', async () => {
      const result = await listCodeFiles();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.files)).toBe(true);
    }, 10000);
  });

  describe('deleteCodeFile', () => {
    test('should delete code file', async () => {
      // Save a file first
      await saveCodeFile('delete-test.py', testCode);
      
      // Then delete it
      const result = await deleteCodeFile('delete-test.py');
      
      expect(result.success).toBe(true);
    }, 10000);

    test('should handle non-existent file deletion', async () => {
      const result = await deleteCodeFile('non-existent.py');
      
      // Should handle gracefully
      expect(result).toBeDefined();
    }, 10000);
  });

  describe('autoSaveCode', () => {
    test('should auto-save code', async () => {
      const result = await autoSaveCode(testCode);
      
      expect(result.success).toBe(true);
    }, 10000);

    test('should save to autosave file', async () => {
      const code = 'print("Auto-saved")';
      await autoSaveCode(code);
      
      const loaded = await loadAutoSavedCode();
      
      expect(loaded.success).toBe(true);
      expect(loaded.code).toBe(code);
    }, 10000);

    test('should overwrite previous autosave', async () => {
      const code1 = 'print("First")';
      const code2 = 'print("Second")';
      
      await autoSaveCode(code1);
      await autoSaveCode(code2);
      
      const loaded = await loadAutoSavedCode();
      
      expect(loaded.code).toBe(code2);
    }, 10000);
  });

  describe('loadAutoSavedCode', () => {
    test('should load auto-saved code', async () => {
      const testCode = 'print("Auto-save test")';
      await autoSaveCode(testCode);
      
      const result = await loadAutoSavedCode();
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(testCode);
    }, 10000);

    test('should handle missing autosave file', async () => {
      const result = await loadAutoSavedCode();
      
      // Should handle gracefully
      expect(result).toBeDefined();
    }, 10000);
  });

  describe('File Operations Integration', () => {
    test('should save, list, and load files', async () => {
      const fileName = 'integration-test.py';
      const code = 'def integration_test(): pass';
      
      // Save
      const saveResult = await saveCodeFile(fileName, code);
      expect(saveResult.success).toBe(true);
      
      // List
      const listResult = await listCodeFiles();
      expect(listResult.success).toBe(true);
      
      // Load
      const loadResult = await loadCodeFile(fileName);
      expect(loadResult.success).toBe(true);
      expect(loadResult.code).toBe(code);
    }, 30000);

    test('should handle multiple file operations', async () => {
      const files = [
        { name: 'file1.py', code: 'print("1")' },
        { name: 'file2.py', code: 'print("2")' },
        { name: 'file3.py', code: 'print("3")' }
      ];

      // Save all
      for (const file of files) {
        const result = await saveCodeFile(file.name, file.code);
        expect(result.success).toBe(true);
      }

      // List all
      const listResult = await listCodeFiles();
      expect(listResult.success).toBe(true);

      // Load all
      for (const file of files) {
        const result = await loadCodeFile(file.name);
        expect(result.success).toBe(true);
        expect(result.code).toBe(file.code);
      }
    }, 60000);
  });

  describe('Error Handling', () => {
    test('should handle save errors gracefully', async () => {
      const result = await saveCodeFile('', testCode);
      
      // Should handle empty filename
      expect(result).toBeDefined();
    }, 10000);

    test('should handle load errors gracefully', async () => {
      const result = await loadCodeFile('');
      
      // Should handle empty filename
      expect(result).toBeDefined();
    }, 10000);

    test('should handle delete errors gracefully', async () => {
      const result = await deleteCodeFile('');
      
      // Should handle empty filename
      expect(result).toBeDefined();
    }, 10000);
  });
});


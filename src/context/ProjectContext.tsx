import React, { createContext, useContext, useState, useEffect } from "react";
import { streamGenerateCode, ModelType } from "../services/gemini-api";

// Define the file/folder structure
export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  extension?: string;
  content?: string;
}

// Sample files for a Python project
const initialFiles: FileNode[] = [
  {
    id: "root",
    name: "Python Project",
    type: "folder",
    children: [
      {
        id: "main.py",
        name: "main.py",
        type: "file",
        extension: "py",
        content:
          '#!/usr/bin/env python3\n"""\nMain entry point for the Python application.\n"""\n\ndef main():\n    """Main function that runs the application."""\n    print("Hello, Python IDE!")\n    print("Welcome to your AI-powered Python development environment.")\n\n\nif __name__ == "__main__":\n    main()\n',
      },
      {
        id: "requirements.txt",
        name: "requirements.txt",
        type: "file",
        extension: "txt",
        content:
          "# Python dependencies\n# Add your project dependencies here\n# Example:\n# numpy==1.24.0\n# pandas==2.0.0\n",
      },
      {
        id: "README.md",
        name: "README.md",
        type: "file",
        extension: "md",
        content:
          "# Python Project\n\nThis is a Python project created with the AI-Powered Python IDE.\n\n## Getting Started\n\n1. Install dependencies:\n   ```bash\n   pip install -r requirements.txt\n   ```\n\n2. Run the main script:\n   ```bash\n   python main.py\n   ```\n",
      },
    ],
  },
];

// Context type for project-related operations
interface ProjectContextType {
  files: FileNode[];
  currentFile: FileNode | null;
  rootNode: FileNode;
  selectedFile: FileNode | null; // Alias for currentFile for better semantics
  setCurrentFile: (file: FileNode | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
  addNewFile: (
    name: string,
    type: "file" | "folder",
    parentId?: string,
  ) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  generateProject: (
    prompt: string,
    modelType: any,
    options: {
      currentFile?: string;
      currentFileContent?: string;
      projectContext?: string;
      streamingOutput?: (output: string) => void;
    },
  ) => Promise<any>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Helper function to find a file by ID
const findFileById = (files: FileNode[], id: string): FileNode | null => {
  for (const file of files) {
    if (file.id === id) {
      return file;
    }
    if (file.children && file.children.length > 0) {
      const found = findFileById(file.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Helper function to update file content by ID
const updateFileContentById = (
  files: FileNode[],
  id: string,
  content: string,
): FileNode[] => {
  return files.map((file) => {
    if (file.id === id) {
      return { ...file, content };
    } else if (file.children) {
      return {
        ...file,
        children: updateFileContentById(file.children, id, content),
      };
    }
    return file;
  });
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);

  // Set default file when component mounts
  useEffect(() => {
    // Set main.py as default file
    const defaultFile = findFileById(files, "main.py");
    if (defaultFile) {
      setCurrentFile(defaultFile);
    }
  }, [files]); // Add files as a dependency

  const updateFileContent = (fileId: string, content: string) => {
    setFiles((prevFiles) => updateFileContentById(prevFiles, fileId, content));

    // Update current file if it's the one being modified
    if (currentFile && currentFile.id === fileId) {
      setCurrentFile({
        ...currentFile,
        content,
      });
    }
  };

  const addNewFile = (
    name: string,
    type: "file" | "folder",
    parentId?: string,
  ) => {
    const newId = Date.now().toString();
    const newFile: FileNode = {
      id: newId,
      name,
      type,
      content: type === "file" ? "" : undefined,
      children: type === "folder" ? [] : undefined,
    };

    setFiles((prevFiles) => {
      const addFileToChildren = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newFile],
            };
          } else if (node.children) {
            return {
              ...node,
              children: addFileToChildren(node.children),
            };
          }
          return node;
        });
      };

      // If no parentId, add to root
      if (!parentId) {
        return [...prevFiles, newFile];
      }

      return addFileToChildren(prevFiles);
    });
  };

  const deleteFile = (fileId: string) => {
    // If deleting current file, clear current file
    if (currentFile && currentFile.id === fileId) {
      setCurrentFile(null);
    }

    setFiles((prevFiles) => {
      const removeFileFromChildren = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((node) => node.id !== fileId)
          .map((node) => {
            if (node.children) {
              return {
                ...node,
                children: removeFileFromChildren(node.children),
              };
            }
            return node;
          });
      };

      return removeFileFromChildren(prevFiles);
    });
  };

  const renameFile = (fileId: string, newName: string) => {
    setFiles((prevFiles) => {
      const renameFileInTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === fileId) {
            return { ...node, name: newName };
          }
          if (node.children) {
            return { ...node, children: renameFileInTree(node.children) };
          }
          return node;
        });
      };
      return renameFileInTree(prevFiles);
    });
  };

  const generateProject = async (
    prompt: string,
    modelType: ModelType,
    options: {
      currentFile?: string;
      currentFileContent?: string;
      projectContext?: string;
      streamingOutput?: (output: string) => void;
    },
  ) => {
    const systemPrompt = `
      You are a project generator AI. Based on the user's prompt, create a file structure for a new project.
      Return a JSON object representing the file structure.
      The JSON object should have the following structure:
      {
        "id": "root",
        "name": "Project Name",
        "type": "folder",
        "children": [
          {
            "id": "file1.py",
            "name": "file1.py",
            "type": "file",
            "extension": "py",
            "content": "..."
          },
          {
            "id": "folder1",
            "name": "folder1",
            "type": "folder",
            "children": [
              ...
            ]
          }
        ]
      }
    `;

    return new Promise((resolve, reject) => {
      streamGenerateCode(
        prompt,
        modelType,
        systemPrompt,
        (chunk) => {
          if (options.streamingOutput) {
            options.streamingOutput(chunk);
          }
        },
        (fullResponse) => {
          try {
            const projectStructure = JSON.parse(fullResponse);
            setFiles([projectStructure]);
            const defaultFile = findFileById([projectStructure], "main.py");
            setCurrentFile(defaultFile);
            resolve(projectStructure);
          } catch (error) {
            console.error("Error parsing project structure:", error);
            reject(error);
          }
        },
        (error) => {
          console.error("Error generating project:", error);
          reject(error);
        },
      );
    });
  };

  // Root node is the first item in the files array
  const rootNode = files[0] || {
    id: "root",
    name: "Python Project",
    type: "folder",
    children: [],
  };

  return (
    <ProjectContext.Provider
      value={{
        files,
        currentFile,
        rootNode,
        selectedFile: currentFile, // Alias for currentFile
        setCurrentFile,
        updateFileContent,
        addNewFile,
        deleteFile,
        renameFile,
        generateProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

// Add this alias for components that expect useProjectContext
export const useProjectContext = useProject;

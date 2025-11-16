import { FileNode } from "../context/ProjectContext";

// Handle potential import errors gracefully
let JSZip: any;
let saveAs: any;

try {
  JSZip = require("jszip");
  saveAs = require("file-saver").saveAs;
} catch (error) {
  console.error("Error importing JSZip or file-saver:", error);
  // Provide fallback implementations if imports fail
  JSZip = class {
    file() {
      return this;
    }
    generateAsync() {
      return Promise.resolve(new Blob([]));
    }
  };
  saveAs = (blob: Blob, filename: string) => {
    console.error("file-saver not available, using fallback");
    // Create a download link manually
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

/**
 * Creates a downloadable zip file from the project files
 * @param rootNode The root node of the file structure
 * @param projectName The name of the project (used for the zip file name)
 */
export const downloadProjectAsZip = async (
  rootNode: FileNode,
  projectName: string = "website",
): Promise<void> => {
  if (!JSZip) {
    alert("JSZip library is not available. Cannot create ZIP file.");
    return Promise.reject(new Error("JSZip library not available"));
  }
  try {
    const zip = new JSZip();

    // Recursive function to add files to zip
    const addToZip = (node: FileNode, currentPath: string = "") => {
      if (node.type === "file") {
        // Add file to zip
        zip.file(`${currentPath}${node.name}`, node.content || "");
      } else if (node.type === "folder" && node.children) {
        // Process each child in the folder
        node.children.forEach((child) => {
          const newPath = `${currentPath}${node.name}/`;
          addToZip(child, newPath);
        });
      }
    };

    // Add all children of the root node to the zip
    if (rootNode.children) {
      rootNode.children.forEach((child) => {
        addToZip(child, "");
      });
    }

    // Generate zip file and trigger download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${projectName}.zip`);

    return Promise.resolve();
  } catch (error) {
    console.error("Error creating zip file:", error);
    return Promise.reject(error);
  }
};

/**
 * Creates a URL for a single file download
 * @param content The content of the file
 * @param fileName The name of the file
 */
export const downloadSingleFile = (content: string, fileName: string): void => {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

    // Use saveAs if available, otherwise use browser API
    if (saveAs) {
      saveAs(blob, fileName);
    } else {
      // Create a download link manually as fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    alert("Failed to download file. See console for details.");
  }
};

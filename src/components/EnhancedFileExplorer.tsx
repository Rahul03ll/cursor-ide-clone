import React, { useState, useRef } from "react";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaPlus,
  FaTrash,
  FaEllipsisV,
  FaCode,
  FaCss3,
  FaHtml5,
  FaJs,
} from "react-icons/fa";
import { useProject, FileNode } from "../context/ProjectContext";

interface EnhancedFileExplorerProps {
  rootNode?: FileNode;
  files?: FileNode[];
  onSelectFile: (file: FileNode | null) => void;
  selectedFileId?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
  onRename: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onNewFile,
  onNewFolder,
  onDelete,
  onRename,
}) => {
  // Close the context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 border-gray-200 z-50 py-1"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()} // Prevent click from closing immediately
    >
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
        onClick={onNewFile}
      >
        <FaFile className="mr-2" /> New File
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
        onClick={onNewFolder}
      >
        <FaFolder className="mr-2" /> New Folder
      </button>
      <div className="border-t dark:border-gray-700 border-gray-200 my-1"></div>
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
        onClick={onRename}
      >
        <FaCode className="mr-2" /> Rename
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 flex items-center"
        onClick={onDelete}
      >
        <FaTrash className="mr-2" /> Delete
      </button>
    </div>
  );
};

interface NewItemModalProps {
  type: "file" | "folder";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const NewItemModal: React.FC<NewItemModalProps> = ({
  type,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(
    type === "file" ? "new-file.js" : "new-folder",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-80">
        <h3 className="text-lg font-medium mb-4">
          {type === "file" ? "New File" : "New Folder"}
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-700 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RenameModalProps {
  currentName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({
  currentName,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-80">
        <h3 className="text-lg font-medium mb-4">Rename</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-700 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper to get file icon based on extension
const getFileIcon = (extension?: string) => {
  switch (extension) {
    case "html":
      return <FaHtml5 className="text-orange-500" />;
    case "css":
      return <FaCss3 className="text-blue-500" />;
    case "js":
      return <FaJs className="text-yellow-500" />;
    default:
      return <FaFile className="text-gray-500" />;
  }
};

// Main component
const EnhancedFileExplorer: React.FC<EnhancedFileExplorerProps> = ({
  rootNode,
  files: propFiles,
  onSelectFile,
  selectedFileId,
}) => {
  const {
    files: contextFiles,
    currentFile,
    setCurrentFile,
    addNewFile,
    deleteFile,
    renameFile,
  } = useProject();

  // Use props if provided, otherwise use context
  const files = rootNode ? [rootNode] : propFiles || contextFiles;
  const [expandedFolders, setExpandedFolders] = useState<{
    [key: string]: boolean;
  }>({
    root: true,
  });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId: string;
    nodeType: "file" | "folder";
  } | null>(null);
  const [newItemModal, setNewItemModal] = useState<{
    visible: boolean;
    type: "file" | "folder";
    parentId: string;
  } | null>(null);
  const [renameModal, setRenameModal] = useState<{
    visible: boolean;
    nodeId: string;
    currentName: string;
  } | null>(null);

  const explorerId = useRef(`file-explorer-${Date.now()}`);

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent triggering file selection if event is provided
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const selectFile = (file: any) => {
    if (file.type === "file") {
      // Use the prop-based handler if available, otherwise fall back to context
      if (onSelectFile) {
        onSelectFile(file);
      } else {
        setCurrentFile(file);
      }
    } else {
      toggleFolder(file.id);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    nodeId: string,
    nodeType: "file" | "folder",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      nodeId,
      nodeType,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const showNewItemModal = (type: "file" | "folder") => {
    if (contextMenu) {
      setNewItemModal({
        visible: true,
        type,
        parentId: contextMenu.nodeId,
      });
      closeContextMenu();
    }
  };

  const handleNewItem = (name: string) => {
    if (newItemModal) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const extension = name.includes(".") ? name.split(".").pop() : undefined;
      addNewFile(name, newItemModal.type, newItemModal.parentId);
      setNewItemModal(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      deleteFile(contextMenu.nodeId);
      closeContextMenu();
    }
  };

  const showRenameModal = () => {
    if (contextMenu) {
      // Find node by id to get current name
      const findNode = (nodes: any[], id: string): any => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(files, contextMenu.nodeId);
      if (node) {
        setRenameModal({
          visible: true,
          nodeId: contextMenu.nodeId,
          currentName: node.name,
        });
      }
      closeContextMenu();
    }
  };

  const handleRename = (newName: string) => {
    if (renameModal) {
      renameFile(renameModal.nodeId, newName);
      setRenameModal(null);
    }
  };
  // Render file tree recursively
  const renderFileTree = (nodes: any[], level: number = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === "folder";
      const isExpanded = expandedFolders[node.id];
      const isSelected = currentFile && currentFile.id === node.id;

      return (
        <div key={node.id}>
          <div
            className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? "bg-blue-100 dark:bg-blue-900" : ""}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => selectFile(node)}
            onContextMenu={(e) => handleContextMenu(e, node.id, node.type)}
          >
            <div className="mr-1 w-4">
              {isFolder ? (
                isExpanded ? (
                  <FaFolderOpen
                    className="text-yellow-500"
                    onClick={(e) => toggleFolder(node.id, e)}
                  />
                ) : (
                  <FaFolder
                    className="text-yellow-500"
                    onClick={(e) => toggleFolder(node.id, e)}
                  />
                )
              ) : (
                getFileIcon(node.extension)
              )}
            </div>
            <span className="flex-grow truncate">{node.name}</span>
            <button
              className="p-1 opacity-0 hover:opacity-100 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, node.id, node.type);
              }}
            >
              <FaEllipsisV size={12} />
            </button>
          </div>

          {isFolder && isExpanded && node.children && (
            <div>{renderFileTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      id={explorerId.current}
      className="h-full overflow-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700 border-gray-200"
    >
      <div className="p-3 border-b dark:border-gray-700 border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">Files</h3>
        <div className="flex space-x-1">
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              setNewItemModal({
                visible: true,
                type: "file",
                parentId: "root",
              });
            }}
            title="New File"
          >
            <FaPlus size={14} />
          </button>
        </div>
      </div>

      <div className="p-2">{renderFileTree(files)}</div>

      {/* Context Menu */}
      {contextMenu && contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onNewFile={() => showNewItemModal("file")}
          onNewFolder={() => showNewItemModal("folder")}
          onDelete={handleDelete}
          onRename={showRenameModal}
        />
      )}

      {/* New Item Modal */}
      {newItemModal && newItemModal.visible && (
        <NewItemModal
          type={newItemModal.type}
          onSubmit={handleNewItem}
          onCancel={() => setNewItemModal(null)}
        />
      )}

      {/* Rename Modal */}
      {renameModal && renameModal.visible && (
        <RenameModal
          currentName={renameModal.currentName}
          onSubmit={handleRename}
          onCancel={() => setRenameModal(null)}
        />
      )}
    </div>
  );
};

export default EnhancedFileExplorer;

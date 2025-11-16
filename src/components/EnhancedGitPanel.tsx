import React, { useState, useEffect } from 'react';
import { FaGitAlt, FaCodeBranch, FaPlus, FaMinus, FaUpload, FaDownload, FaHistory, FaTimes } from 'react-icons/fa';

interface GitPanelProps {
  onClose: () => void;
  projectPath?: string;
}

interface GitChange {
  file: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

const EnhancedGitPanel: React.FC<GitPanelProps> = ({ onClose, projectPath }) => {
  const [branch, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setBranch] = useState<string>('main');
  const [changes, setChanges] = useState<GitChange[]>([]);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  
  // Simulate fetching Git status
  useEffect(() => {
    const fetchGitStatus = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call a Git API or execute Git commands
        // For now, we'll simulate some changes
        setTimeout(() => {
          setChanges([
            { file: 'index.html', status: 'modified' },
            { file: 'style.css', status: 'modified' },
            { file: 'app.js', status: 'added' },
            { file: 'README.md', status: 'untracked' }
          ]);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching git status:', error);
        setIsLoading(false);
      }
    };
    
    fetchGitStatus();
  }, [projectPath]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'modified': return <FaHistory className="text-[#CCCC29]" />;
      case 'added': return <FaPlus className="text-[#73C991]" />;
      case 'deleted': return <FaMinus className="text-[#F14C4C]" />;
      case 'untracked': return <FaPlus className="text-[#3794FF]" />;
      default: return null;
    }
  };
  
  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate Git commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChanges([]);
      setCommitMessage('');
      setIsLoading(false);
    } catch (error) {
      console.error('Error committing changes:', error);
      setIsLoading(false);
    }
  };
  
  const generateCommitMessage = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the AI service
      // For now, we'll generate a simple commit message
      setTimeout(() => {
        setCommitMessage('Update UI components and fix styling issues');
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error generating commit message:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc] border-t border-[#3e3e42]">
      <div className="flex justify-between items-center p-2 border-b border-[#3e3e42]">
        <div className="flex items-center">
          <FaGitAlt className="mr-2" />
          <h3 className="font-medium">Source Control</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-2 py-1 bg-[#252526] rounded">
            <FaCodeBranch className="mr-1 text-sm" />
            <span className="text-sm">{branch}</span>
          </div>
          <button 
            className="hover:bg-[#2a2d2e] p-1 rounded"
            title="Pull changes"
          >
            <FaDownload size={14} />
          </button>
          <button 
            className="hover:bg-[#2a2d2e] p-1 rounded"
            title="Push changes"
          >
            <FaUpload size={14} />
          </button>
          <button
            onClick={onClose}
            className="hover:bg-[#2a2d2e] p-1 rounded"
            title="Close panel"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex border-b border-[#3e3e42]">
        <button
          className={`px-4 py-2 ${activeTab === 'changes' ? 'border-b-2 border-[#007ACC]' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-[#007ACC]' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>
      
      {activeTab === 'changes' ? (
        <>
          <div className="flex-grow overflow-auto p-2">
            <h4 className="text-sm uppercase text-[#8f8f8f] mb-2">Changes</h4>
            {isLoading ? (
              <div className="text-center py-4 text-[#8f8f8f]">Loading changes...</div>
            ) : changes.length === 0 ? (
              <div className="text-center py-4 text-[#8f8f8f]">No changes detected</div>
            ) : (
              changes.map(change => (
                <div 
                  key={change.file}
                  className="flex items-center py-1 px-2 hover:bg-[#2a2d2e] rounded cursor-pointer"
                >
                  {getStatusIcon(change.status)}
                  <span className="ml-2">{change.file}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-[#3e3e42]">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm uppercase text-[#8f8f8f]">Commit Message</h4>
              <button 
                onClick={generateCommitMessage}
                className="text-xs hover:bg-[#2a2d2e] p-1 rounded flex items-center"
                disabled={isLoading}
              >
                <FaGitAlt className="mr-1" size={10} />
                <span>Generate</span>
              </button>
            </div>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full bg-[#252526] border border-[#3e3e42] rounded p-2 mb-2 text-sm"
              placeholder="Enter commit message..."
              rows={3}
            />
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || isLoading}
              className={`w-full py-1 rounded ${
                !commitMessage.trim() || isLoading
                  ? 'bg-[#3e3e42] text-[#8f8f8f]'
                  : 'bg-[#0e639c] hover:bg-[#1177bb] text-white'
              }`}
            >
              {isLoading ? 'Committing...' : 'Commit Changes'}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-grow overflow-auto p-2">
          <h4 className="text-sm uppercase text-[#8f8f8f] mb-2">Commit History</h4>
          <div className="border border-[#3e3e42] rounded mb-2">
            <div className="p-2 border-b border-[#3e3e42] bg-[#252526]">
              <div className="text-sm font-medium">Initial commit</div>
              <div className="text-xs text-[#8f8f8f]">2 days ago</div>
            </div>
            <div className="p-2">
              <div className="text-sm">Added basic project structure</div>
            </div>
          </div>
          <div className="border border-[#3e3e42] rounded mb-2">
            <div className="p-2 border-b border-[#3e3e42] bg-[#252526]">
              <div className="text-sm font-medium">Feature: AI integration</div>
              <div className="text-xs text-[#8f8f8f]">1 day ago</div>
            </div>
            <div className="p-2">
              <div className="text-sm">Implemented AI code generation API and UI</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGitPanel;

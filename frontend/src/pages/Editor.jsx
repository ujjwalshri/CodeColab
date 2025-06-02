import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { runCode } from '../services/runCode';
import Split from 'react-split';
import './Editor.css';
import { CODE_SNIPPETS } from '../constants/languages';

const EditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, fileName, content: initialContent } = location.state || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const getStorageKey = useCallback(() => {
    return `codecolab_${fileName || `untitled.${language}`}`;
  }, [fileName, language]);

  const clearFileStorage = useCallback(() => {
    const storageKey = getStorageKey();
    localStorage.removeItem(storageKey);
  }, [getStorageKey]);

  // Initialize editor content with priority:
  // 1. Uploaded file content (initialContent)
  // 2. Previously saved content from localStorage
  // 3. Language-specific code snippet
  // 4. Empty string
  const [editorContent, setEditorContent] = useState(() => {
    if (initialContent) {
      // If there's uploaded content, save it to localStorage immediately
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, initialContent);
      return initialContent;
    }
    
    const storageKey = getStorageKey();
    const savedContent = localStorage.getItem(storageKey);
    return savedContent || CODE_SNIPPETS[language] || '';
  });

  const [output, setOutput] = useState('');

  // Save content to localStorage whenever it changes
  useEffect(() => {
    if (language && editorContent) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, editorContent);
    }
  }, [editorContent, getStorageKey, language]);

  // Cleanup localStorage when unmounting
  useEffect(() => {
    return () => {
      clearFileStorage();
    };
  }, [clearFileStorage]);

  const runMutation = useMutation({
    mutationFn: () => runCode(editorContent, language),
    onSuccess: (data) => {
      setOutput(
        data.run.output || 
        data.run.stderr || 
        'No output'
      );
    },
    onError: (error) => {
      setOutput(`Error: ${error.message}`);
    }
  });

  if (!language) {
    navigate('/');
    return null;
  }

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleNewFile = () => {
    clearFileStorage();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-base-300 flex flex-col">
      <div className="bg-base-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className={`btn btn-sm btn-primary ${runMutation.isPending ? 'loading' : ''}`}
            >
              {runMutation.isPending ? 'Running...' : 'Run Code'}
            </button>
            <button 
              onClick={handleNewFile}
              className="btn btn-sm btn-ghost"
            >
              New File
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-base-200 border-r border-base-300"
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium opacity-70">Explorer</span>
                </div>
                <div className="bg-base-300 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg 
                      className="w-4 h-4 mt-1 text-primary" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <span className="font-mono text-sm break-all">
                      {fileName || `untitled.${language}`}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="absolute left-0 top-4 z-10 bg-base-200 hover:bg-base-300 p-1 rounded-r-lg shadow-md"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <Split 
            className="split-container"
            sizes={[60, 40]}
            minSize={100}
            expandToMin={false}
            gutterSize={10}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
          >
            <div className="h-[calc(100vh-56px)] overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                theme="vs-dark"
                value={editorContent}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  readOnly: false,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
            <div className="bg-base-200 h-[calc(100vh-56px)] p-4 overflow-auto">
              <div className="bg-base-300 rounded-lg h-full p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Output</h3>
                  {runMutation.isSuccess && (
                    <span className="text-xs text-success">Execution completed</span>
                  )}
                </div>
                <div className="font-mono text-sm whitespace-pre-wrap bg-base-100 p-4 rounded-lg min-h-[200px] max-h-[calc(100vh-200px)] overflow-auto">
                  {runMutation.isPending ? (
                    <div className="flex items-center justify-center h-full text-base-content/60">
                      Running code...
                    </div>
                  ) : output || 'Run your code to see the output'}
                </div>
              </div>
            </div>
          </Split>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { runCode } from '../services/runCode';
import { socketService } from '../services/socket';
import RoomInfo from '../components/RoomInfo';
import UsernameModal from '../components/UsernameModal';
import Split from 'react-split';
import './Editor.css';
import { CODE_SNIPPETS } from '../constants/languages';

const EditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, fileName, content: initialContent, roomId, username: initialUsername } = location.state || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isRemoteExecuting, setIsRemoteExecuting] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(!initialUsername && !!roomId);

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
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState(null);
  
  const handleUsernameSubmit = (username) => {
    socketService.connect();
    socketService.setUsername(username);
    
    if (roomId) {
      socketService.joinRoom(roomId, username);
      setIsInRoom(true);
    }
    
    setShowUsernameModal(false);
  };

  // Initialize socket connection and room handling
  useEffect(() => {
    if (roomId && initialUsername) {
      // Connect to socket server
      socketService.connect();
      
      // Set username and join the room
      socketService.setUsername(initialUsername);
      socketService.joinRoom(roomId, initialUsername);
      setIsInRoom(true);

      // Set initial room state if we're the first one in the room
      if (initialContent || editorContent) {
        socketService.setRoomState(roomId, editorContent || initialContent, language, fileName);
      }

      // Fetch current room users
      socketService.getRoomUsers(roomId, ({ users }) => {
        if (Array.isArray(users) && users.length > 0) {
          setConnectedUsers(users.map(user => user.username).filter(Boolean));
        } else {
          // If no other users, at least add ourselves
          setConnectedUsers([initialUsername]);
        }
      });

      // Handle room state updates from server
      socketService.onRoomState(({ code, language: roomLanguage, fileName: roomFileName, terminalOutput, users }) => {
        if (code && roomLanguage) {
          setEditorContent(code);
          if (terminalOutput) {
            setOutput(terminalOutput);
          }
          
          // Update connected users if provided
          if (users && Array.isArray(users)) {
            setConnectedUsers(users.map(user => user.username).filter(Boolean));
          }
          
          // Only update URL state if we're joining an existing room
          if (!initialContent) {
            navigate('/editor', {
              state: {
                ...location.state,
                language: roomLanguage,
                fileName: roomFileName,
              },
              replace: true // Replace current history entry to avoid navigation issues
            });
          }
        }
      });

      // Handle terminal output updates from other users
      socketService.onTerminalOutput(({ output: newOutput }) => {
        setOutput(newOutput);
      });

      // Handle terminal clear events
      socketService.onTerminalClear(() => {
        setOutput('');
      });

      // Handle code updates from other users
      socketService.onCodeUpdate(({ code, language: remoteLang }) => {
        setLastRemoteUpdate(Date.now());
        setEditorContent(code);
      });

      // Handle user joined events
      socketService.onUserJoined(({ username }) => {
        if (username) {
          setConnectedUsers(prev => {
            if (!prev.includes(username)) {
              return [...prev, username];
            }
            return prev;
          });
        }
      });

      // Handle user left events
      socketService.onUserLeft(({ username }) => {
        if (username) {
          setConnectedUsers(prev => prev.filter(user => user !== username));
        }
      });

      // Handle remote execution state
      socketService.onExecutionStart(() => {
        setIsRemoteExecuting(true);
      });

      socketService.onExecutionEnd(({ success, output }) => {
        setIsRemoteExecuting(false);
        setOutput(output);
      });

      // Cleanup on unmount
      return () => {
        if (roomId) {
          socketService.leaveRoom(roomId);
          clearFileStorage();
        }
        socketService.disconnect();
      };
    }
  }, [roomId, language, fileName, initialContent, editorContent, initialUsername]);

  // Handle editor content changes
  useEffect(() => {
    if (language && editorContent) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, editorContent);
    }
  }, [editorContent, getStorageKey, language]);

  // Cleanup localStorage when unmounting
  useEffect(() => {
    return () => {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    };
  }, [getStorageKey]);

  const runMutation = useMutation({
    mutationFn: () => {
      // Notify other users that code execution is starting
      if (roomId) {
        socketService.emitExecutionStart(roomId);
      }
      return runCode(editorContent, language);
    },
    onSuccess: (data) => {
      const outputText = data.run.output || data.run.stderr || 'No output';
      setOutput(outputText);
      // Notify other users that execution has finished
      if (roomId) {
        socketService.emitExecutionEnd(roomId, true, outputText);
      }
    },
    onError: (error) => {
      const errorText = `Error: ${error.message}`;
      setOutput(errorText);
      // Notify other users about the error
      if (roomId) {
        socketService.emitExecutionEnd(roomId, false, errorText);
      }
    }
  });

  if (!language) {
    navigate('/');
    return null;
  }

  const handleEditorChange = (value) => {
    // Prevent echo of remote updates
    if (Date.now() - lastRemoteUpdate < 100) return;
    
    setEditorContent(value);
    
    // Emit changes to room if in collaboration mode
    if (roomId) {
      socketService.emitCodeChange(roomId, value, language);
    }
  };

  const handleNewFile = () => {
    clearFileStorage();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-base-300 flex flex-col">
      <div className="bg-base-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {roomId && (
              <RoomInfo roomId={roomId} connectedUsers={connectedUsers} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || isRemoteExecuting}
              className={`btn btn-sm btn-primary ${(runMutation.isPending || isRemoteExecuting) ? 'loading' : ''}`}
            >
              {runMutation.isPending || isRemoteExecuting ? 'Running...' : 'Run Code'}
            </button>
            <button 
              onClick={() => {
                if (roomId) {
                  socketService.leaveRoom(roomId);
                }
                clearFileStorage();
                navigate('/');
              }}
              className="btn btn-sm btn-ghost"
            >
              {roomId ? 'Leave Room' : 'New File'}
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

                {roomId && connectedUsers.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium opacity-70 mb-2">Connected Users ({connectedUsers.length})</h3>
                    <ul className="bg-base-300 rounded-lg p-2">
                      {connectedUsers.map((username, index) => (
                        <li key={index} className="flex items-center gap-2 py-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-sm">{username}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
      
      {/* Username Modal */}
      <AnimatePresence>
        {showUsernameModal && (
          <UsernameModal 
            isOpen={showUsernameModal}
            onClose={() => {
              // If user closes modal without submitting a username, go back to home
              navigate('/');
            }}
            onSubmit={handleUsernameSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorPage;
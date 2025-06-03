import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { languages } from '../constants/languages';
import UsernameModal from './UsernameModal';
import { socketService } from '../services/socket';

const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const handleUsernameSubmit = (username) => {
    // Connect to socket and set username
    socketService.connect();
    socketService.setUsername(username);

    // Navigate to editor with the pending navigation state
    if (pendingNavigation) {
      navigate('/editor', {
        state: {
          ...pendingNavigation,
          username
        }
      });
      setPendingNavigation(null);
    }
    
    setShowUsernameModal(false);
  };

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      const extension = file.name.split('.').pop().toLowerCase();
      const lang = languages.find(l => l.extension === extension);
      if (lang) {
        const newRoomId = generateRoomId();
        // Store navigation info and show username modal
        setPendingNavigation({
          language: lang.id,
          fileName: file.name,
          content,
          roomId: newRoomId
        });
        setShowUsernameModal(true);
      }
    };
    reader.readAsText(file);
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/*': ['.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css']
    }
  });

  const handleLanguageSelect = (langId) => {
    const lang = languages.find(l => l.id === langId);
    const newRoomId = generateRoomId();
    
    // Store navigation info and show username modal
    setPendingNavigation({
      language: langId,
      fileName: `untitled.${lang.extension}`,
      roomId: newRoomId
    });
    setShowUsernameModal(true);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setJoinError('Please enter a room ID');
      return;
    }
    
    // Store navigation info and show username modal
    setPendingNavigation({
      roomId,
      language: 'javascript', // Default language for joined rooms
      fileName: 'untitled.js'
    });
    setShowUsernameModal(true);
    setShowJoinModal(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        '0 0 0 rgba(66, 153, 225, 0)',
        '0 0 20px rgba(66, 153, 225, 0.3)',
        '0 0 0 rgba(66, 153, 225, 0)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            Welcome to CodeColab
          </h1>
          <p className="text-xl text-gray-300 opacity-90">
            Start coding by choosing a language, uploading your code, or joining a collaboration room
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* New File Section */}
          <motion.div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-8 text-center text-gray-100">Start New File</h2>
            <div className="grid grid-cols-1 gap-4">
              {languages.map((lang) => (
                <motion.button
                  key={lang.id}
                  onClick={() => handleLanguageSelect(lang.id)}
                  className="btn bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {lang.name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-8 text-center text-gray-100">Upload Code</h2>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 h-[calc(100%-2rem)]
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-400'}`}
            >
              <input {...getInputProps()} />
              <motion.div 
                className="flex flex-col items-center space-y-4"
                initial={{ scale: 1 }}
                animate={{ scale: isDragActive ? 1.05 : 1 }}
              >
                <motion.svg 
                  className="w-16 h-16 text-blue-400" 
                  fill="none" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: isDragActive ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </motion.svg>
                <div className="text-lg text-gray-200">
                  {isDragActive ? (
                    <p>Drop your code file here</p>
                  ) : (
                    <p>Drag and drop your code file here, or click to select</p>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Supported files: .js, .ts, .py, .java, .cpp, .html, .css
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Join Room Section */}
          <motion.div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-8 text-center text-gray-100">Join Room</h2>
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <motion.button
                onClick={() => setShowJoinModal(true)}
                className="btn btn-primary btn-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join Collaboration Room
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-100">Join Collaboration Room</h3>
              <input
                type="text"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setJoinError('');
                }}
                placeholder="Enter Room ID"
                className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:border-blue-500"
              />
              {joinError && (
                <p className="text-red-500 text-sm mb-4">{joinError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  className="btn btn-primary"
                >
                  Join Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Username Modal */}
      <UsernameModal 
        isOpen={showUsernameModal} 
        onClose={() => setShowUsernameModal(false)}
        onSubmit={handleUsernameSubmit}
      />
    </div>
  );
};

export default HeroSection;
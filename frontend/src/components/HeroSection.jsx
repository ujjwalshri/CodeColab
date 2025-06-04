import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { languages } from '../constants/languages';
import UsernameModal from './UsernameModal';
import { socketService } from '../services/socket';
import { TbBrandCpp } from "react-icons/tb";
import { IoLogoJavascript } from "react-icons/io5";
import { RiJavaLine } from "react-icons/ri";
import { SiTypescript } from "react-icons/si";
import { FaPython } from "react-icons/fa";
import { SiPhp } from "react-icons/si";


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
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'upload', 'join'

  // Animated particles effect
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    // Generate random particles for background effect
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const titleVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 12 
      } 
    }
  };

  const tabVariants = {
    inactive: { scale: 0.95, opacity: 0.7 },
    active: { scale: 1, opacity: 1 }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4 }
    },
    hover: { 
      y: -8,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const codeIconVariants = {
    initial: { rotate: 0 },
    hover: { 
      rotate: 360,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'new':
        return (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            {languages.map((lang, index) => (
              <motion.button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className="relative p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-blue-500 shadow-lg group overflow-hidden"
                variants={itemVariants}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-center flex-col space-y-2">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-600/20 rounded-lg mb-2">
                    <motion.span 
                      className="text-2xl"
                      variants={codeIconVariants}
                      initial="initial"
                      whileHover="hover"
                    >
                      {lang.id === 'javascript' ? <IoLogoJavascript/> : 
                       lang.id === 'python' ? <FaPython/>: 
                       lang.id === 'java' ? <RiJavaLine/> : 
                       lang.id === 'cpp' ? <TbBrandCpp/> : 
                       lang.id === 'typescript' ? <SiTypescript/> :
                       lang.id==='php' ? <SiPhp/> : '💻'}
                    </motion.span>
                  </div>
                  <span className="font-medium text-gray-100">{lang.name}</span>
                  <span className="text-xs text-gray-400">.{lang.extension}</span>
                </div>
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            ))}
          </motion.div>
        );
      
      case 'upload':
        return (
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl mx-auto"
          >
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-400'}`}
            >
              <input {...getInputProps()} />
              <motion.div 
                className="flex flex-col items-center space-y-6"
                initial={{ scale: 1 }}
                animate={{ scale: isDragActive ? 1.05 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center"
                  animate={{ 
                    boxShadow: isDragActive 
                      ? ["0 0 0 0 rgba(59, 130, 246, 0)", "0 0 0 20px rgba(59, 130, 246, 0.1)", "0 0 0 0 rgba(59, 130, 246, 0)"] 
                      : "0 0 0 0 rgba(59, 130, 246, 0)"
                  }}
                  transition={{ 
                    repeat: isDragActive ? Infinity : 0,
                    duration: 2
                  }}
                >
                  <motion.svg 
                    className="w-12 h-12 text-blue-400" 
                    fill="none" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    animate={{ 
                      y: isDragActive ? [0, -5, 0] : 0,
                      rotate: isDragActive ? [0, 0, 0] : 0
                    }}
                    transition={{ 
                      y: { repeat: isDragActive ? Infinity : 0, duration: 1.5 },
                      rotate: { duration: 0.3 }
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </motion.svg>
                </motion.div>
                
                <div>
                  <motion.h3 
                    className="text-xl font-semibold mb-2 text-gray-100"
                    animate={{ scale: isDragActive ? 1.05 : 1 }}
                  >
                    {isDragActive ? 'Drop it like it\'s hot!' : 'Upload your code file'}
                  </motion.h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Drag and drop your code file here, or click to browse
                  </p>
                </div>

                <motion.div
                  className="flex flex-wrap justify-center gap-2"
                  variants={containerVariants}
                >
                  {['.js', '.py', '.java', '.cpp', '.ts', '.html'].map((ext, i) => (
                    <motion.span 
                      key={ext}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: i * 0.1 }}
                    >
                      {ext}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        );
      
      case 'join':
        return (
          <motion.div 
            className="w-full max-w-lg mx-auto"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-8 shadow-2xl border border-gray-700"
              whileHover="hover"
            >
              <div className="text-center mb-8">
                <motion.div 
                  className="w-20 h-20 bg-blue-600/20 rounded-full mx-auto flex items-center justify-center mb-4"
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(59, 130, 246, 0)",
                      "0 0 0 10px rgba(59, 130, 246, 0.1)",
                      "0 0 0 0 rgba(59, 130, 246, 0)"
                    ]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 3
                  }}
                >
                  <svg className="w-10 h-10 text-blue-400" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-semibold mb-2 text-gray-100">Join Existing Room</h3>
                <p className="text-gray-400 text-sm">Enter a room ID to collaborate in real-time</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Room ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => {
                        setRoomId(e.target.value.toUpperCase());
                        setJoinError('');
                      }}
                      placeholder="Enter 6-digit Room ID"
                      className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500 text-center tracking-wider text-lg"
                      maxLength={6}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      animate={{
                        boxShadow: joinError 
                          ? ["0 0 0 0 rgba(239, 68, 68, 0)", "0 0 0 4px rgba(239, 68, 68, 0.2)", "0 0 0 0 rgba(239, 68, 68, 0)"] 
                          : "0 0 0 0 rgba(239, 68, 68, 0)"
                      }}
                      transition={{ 
                        repeat: joinError ? 1 : 0,
                        duration: 0.8
                      }}
                    />
                  </div>
                  {joinError && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {joinError}
                    </motion.p>
                  )}
                </div>

                <motion.button
                  onClick={handleJoinRoom}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg"
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Join Room
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden relative py-12 px-4 sm:px-6">
      {/* Animated background particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-500/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            y: { 
              repeat: Infinity, 
              duration: particle.duration,
              delay: particle.delay
            },
            opacity: { 
              repeat: Infinity, 
              duration: particle.duration,
              delay: particle.delay
            }
          }}
        />
      ))}

      {/* Code decoration elements */}
      <div className="absolute left-6 top-24 opacity-20 hidden lg:block">
        <pre className="text-blue-400 text-xs">
          {`function collaborate() {
  return new Promise((resolve) => {
    resolve('Amazing code');
  });
}`}
        </pre>
      </div>
      <div className="absolute right-6 bottom-24 opacity-20 hidden lg:block">
        <pre className="text-purple-400 text-xs">
          {`class CodeColab {
  constructor() {
    this.creativity = Infinity;
  }
}`}
        </pre>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6"
            variants={titleVariants}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Code<span className="text-white">Colab</span>
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 opacity-90 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Collaborative coding platform for real-time development and pair programming
          </motion.p>

          <motion.div
            className="flex justify-center mt-10 mb-12 relative"
            variants={itemVariants}
          >
            <div className="inline-flex bg-gray-800/50 backdrop-blur p-1.5 rounded-lg border border-gray-700">
              {[
                { id: 'new', label: 'New File' },
                { id: 'upload', label: 'Upload Code' },
                { id: 'join', label: 'Join Room' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  className={`px-5 py-2.5 rounded-md font-medium transition-colors relative ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  animate={activeTab === tab.id ? 'active' : 'inactive'}
                  variants={tabVariants}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-md -z-10"
                      layoutId="activeTab"
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {renderTabContent()}
        </motion.div>
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
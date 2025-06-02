import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { languages } from '../constants/languages';

const HeroSection = () => {
  const navigate = useNavigate();

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      const extension = file.name.split('.').pop().toLowerCase();
      const lang = languages.find(l => l.extension === extension);
      if (lang) {
        navigate('/editor', {
          state: {
            language: lang.id,
            fileName: file.name,
            content
          }
        });
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
    navigate('/editor', {
      state: {
        language: langId,
        fileName: `untitled.${lang.extension}`
      }
    });
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12 space-y-4"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            Welcome to CodeColab
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 opacity-90"
            variants={itemVariants}
          >
            Start coding by choosing a language or uploading your code
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700"
            variants={itemVariants}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-8 text-center text-gray-100">Start with a New File</h2>
            <div className="grid grid-cols-2 gap-4">
              {languages.map((lang) => (
                <motion.button
                  key={lang.id}
                  onClick={() => handleLanguageSelect(lang.id)}
                  className="btn bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {lang.name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700"
            variants={itemVariants}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-8 text-center text-gray-100">Upload Existing Code</h2>
            <motion.div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-400'}`}
              variants={glowVariants}
              animate="animate"
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
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: isDragActive ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </motion.svg>
                <motion.div 
                  className="text-lg text-gray-200"
                  animate={{ scale: isDragActive ? 1.1 : 1 }}
                >
                  {isDragActive ? (
                    <p>Drop your code file here</p>
                  ) : (
                    <p>Drag and drop your code file here, or click to select</p>
                  )}
                </motion.div>
                <p className="text-sm text-gray-400">
                  Supported files: .js, .ts, .py, .java, .cpp, .html, .css
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HeroSection;
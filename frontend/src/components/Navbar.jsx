import React, { useState } from 'react';
import { FaLinkedin, FaGithub, FaCode } from "react-icons/fa";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  return (

    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
     
      <div className="navbar bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-lg shadow-lg border-b border-gray-700/50 sticky top-0 z-30">
      
        <div className="container mx-auto px-4">
          
          <div className="navbar-start">
            <Link 
              to='/' 
              className="flex items-center gap-2"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div 
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                animate={{ 
                  rotate: isHovered ? 360 : 0,
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ 
                  rotate: { duration: 0.6, ease: "easeInOut" },
                  scale: { duration: 0.3 }
                }}
              >
                <FaCode className="text-white" />
              </motion.div>
              
              <div className="flex flex-col">
                <h1 className="text-xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Code<span className="text-white">Colab</span>
                  </span>
                </h1>
                <span className="text-xs text-gray-400 -mt-1">Collaborative Coding</span>
              </div>
            </Link>
          </div>
    
          <div className="navbar-end">
            <div className="flex gap-2">
              <motion.a 
                href="https://www.linkedin.com/in/ujjwal-shrivastava-2a6138268/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800 hover:bg-blue-800/30 border border-gray-700 transition-colors"
                whileHover={{ y: -2, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaLinkedin className="h-5 w-5 text-blue-400" />
              </motion.a>
              
              <motion.a 
                href="https://github.com/ujjwalshri" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800 hover:bg-purple-800/30 border border-gray-700 transition-colors"
                whileHover={{ y: -2, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaGithub className="h-5 w-5 text-purple-400" />
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;
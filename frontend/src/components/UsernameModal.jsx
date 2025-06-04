import React, { useState } from 'react';
import { motion } from 'framer-motion';

const UsernameModal = ({ isOpen, onClose, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    onSubmit(username);
  };

  if (!isOpen) return null;

  return (
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
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        <h3 className="text-xl font-semibold mb-4 text-gray-100">Enter Your Name</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            placeholder="Your name"
            className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UsernameModal;
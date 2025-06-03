import React, { useState } from 'react';
import { motion } from 'framer-motion';

const RoomInfo = ({ roomId, connectedUsers = [] }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showUsersPopup, setShowUsersPopup] = useState(false);

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-success">●</span>
        <span className="text-sm text-gray-300">Room:</span>
        <code className="bg-gray-900/50 px-2 py-1 rounded text-blue-400 font-mono">
          {roomId}
        </code>
      </div>
      <button
        onClick={handleCopyRoomId}
        className="btn btn-xs btn-ghost"
        title="Copy room ID"
      >
        {copySuccess ? (
          <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
      </button>

      {connectedUsers.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowUsersPopup(!showUsersPopup)}
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
          >
            <span className="text-sm text-gray-400">
              {connectedUsers.length} {connectedUsers.length === 1 ? 'user' : 'users'}
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUsersPopup && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-10 min-w-[150px]"
            >
              <ul className="py-2">
                {connectedUsers.map((user, index) => (
                  <li key={index} className="px-4 py-1 text-sm text-gray-300 hover:bg-gray-700">
                    {user}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RoomInfo;
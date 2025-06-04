import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCall from './VideoCall';
import { useLocation } from 'react-router-dom';

const FloatingDock = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const location = useLocation();
  
  // Get roomId from location state when component mounts
  useEffect(() => {
    if (location.state && location.state.roomId) {
      setRoomId(location.state.roomId);
    }
  }, [location]);
  
  // Animation variants
  const dockVariants = {
    hover: {
      scale: 1.1
    },
    tap: {
      scale: 0.95
    }
  };
  
  // Handle toggle functions
  const toggleMute = () => setIsMuted(!isMuted);
  
  const toggleVideo = () => {
    // Only allow video if we have a roomId
    if (!roomId && !isVideoOn) {
      console.warn('Video call requires being in a collaboration room');
      return;
    }
    setIsVideoOn(!isVideoOn);
  };
  
  const toggleChat = () => setIsChatOpen(!isChatOpen);
  
  return (
    <>
      <motion.div 
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-xl rounded-2xl 
                   px-5 py-2 flex items-center gap-8 shadow-xl border border-white/10 cursor-move ${isDragging ? 'z-50' : 'z-10'}`}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        drag
        dragConstraints={{
          top: -300,
          right: 300,
          bottom: 100,
          left: -300
        }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        style={{ touchAction: 'none' }}
      >
        {/* Mute/Unmute Button */}
        <motion.button
          className={`text-white p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} cursor-pointer`}
          variants={dockVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </motion.button>

        {/* Video Call Button */}
        <motion.button
          className={`text-white p-2 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-gray-600'} cursor-pointer ${!roomId && !isVideoOn ? 'opacity-50' : ''}`}
          variants={dockVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={toggleVideo}
          title={!roomId && !isVideoOn ? 'Video requires being in a room' : isVideoOn ? 'End video call' : 'Start video call'}
        >
          {isVideoOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </motion.button>

        {/* Chat Button */}
        <motion.button
          className={`text-white p-2 rounded-full ${isChatOpen ? 'bg-blue-500' : 'bg-gray-600'} cursor-pointer`}
          variants={dockVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={toggleChat}
          title={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>

        {/* Screen Share Button */}
        <motion.button
          className="text-white p-2 rounded-full bg-gray-600 cursor-pointer"
          variants={dockVariants}
          whileHover="hover"
          whileTap="tap"
          title="Share screen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.button>

        {/* Settings Button */}
        <motion.button
          className="text-white p-2 rounded-full bg-gray-600 cursor-pointer"
          variants={dockVariants}
          whileHover="hover"
          whileTap="tap"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.button>
      </motion.div>

      {/* Video Call Component */}
      <AnimatePresence>
        {isVideoOn && roomId && (
          <VideoCall 
            isVisible={isVideoOn} 
            onClose={toggleVideo} 
            roomId={roomId} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingDock;
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCursorColorForUser } from '../utils/cursorColors';
import { webrtcService } from '../services/webrtc';
import { socketService } from '../services/socket';

const VideoCall = ({ isVisible, onClose, roomId }) => {
  const [participants, setParticipants] = useState(new Map()); // userId -> {stream, username, isLocal}
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const videoContainerRef = useRef(null);

  // Handle stream updates from WebRTC service
  const handleStreamUpdate = useCallback((participant) => {
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.set(participant.userId, participant);
      return updated;
    });
  }, []);

  // Handle when a user leaves the call
  const handleUserLeftCall = useCallback((userId) => {
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  }, []);

  // Enhanced close handler to ensure camera is turned off
  const handleCloseCall = useCallback(() => {
    // Ensure we properly end the call and stop all media tracks
    webrtcService.leaveCall();
    // Reset participants
    setParticipants(new Map());
    // Then call the parent's onClose handler
    onClose();
  }, [onClose]);

  // Initialize video call when component becomes visible
  useEffect(() => {
    if (isVisible && roomId) {
      // Initialize WebRTC service with callbacks
      webrtcService.initialize(handleStreamUpdate, handleUserLeftCall);
      
      // Join the call
      webrtcService.joinCall(roomId).catch(err => {
        console.error('Error joining video call:', err);
        // If there's an error accessing camera/mic, close the video call
        handleCloseCall();
      });
    }
    
    // Cleanup when component is hidden or unmounted
    return () => {
      if (isVisible) {
        // Ensure camera and microphone are turned off
        webrtcService.leaveCall();
        // Reset participants
        setParticipants(new Map());
      }
    };
  }, [isVisible, roomId, handleStreamUpdate, handleUserLeftCall, handleCloseCall]);

  // Toggle audio mute state
  const toggleAudio = useCallback(() => {
    const isMuted = webrtcService.toggleAudio();
    setAudioEnabled(!isMuted);
  }, []);

  // Toggle video state
  const toggleVideo = useCallback(() => {
    const isVideoOff = webrtcService.toggleVideo();
    setVideoEnabled(!isVideoOff);
  }, []);

  // Render a single participant video
  const renderParticipantVideo = (participant, index) => {
    const { userId, username, stream, isLocal } = participant;
    const borderColor = getCursorColorForUser(username);
    
    return (
      <motion.div 
        key={userId}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-lg bg-gray-900"
        style={{ 
          aspectRatio: "16/9",
          borderColor,
          borderWidth: "2px"
        }}
      >
        <video
          ref={el => {
            if (el && stream) {
              el.srcObject = stream;
            }
          }}
          autoPlay
          playsInline
          muted={isLocal} // Mute only local video to prevent feedback
          className="w-full h-full object-cover"
        />
        
        {/* Username overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs flex justify-between items-center"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <span>{username} {isLocal && '(You)'}</span>
          
          {isLocal && (
            <div className="flex gap-1">
              <span className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`w-2 h-2 rounded-full ${videoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Calculate grid layout based on number of participants
  const getGridTemplateAreas = () => {
    const count = participants.size;
    
    if (count <= 1) return '"a"';
    if (count === 2) return '"a b"';
    if (count === 3) return '"a b" "c c"';
    if (count === 4) return '"a b" "c d"';
    if (count <= 6) return '"a b c" "d e f"';
    return '"a b c d" "e f g h"'; // Max 8 participants shown in grid
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        width: isMinimized ? '240px' : '580px', 
        height: isMinimized ? 'auto' : 'auto'
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="fixed top-24 right-6 z-30 shadow-2xl"
      drag
      dragConstraints={{
        top: 0,
        right: 0,
        bottom: window.innerHeight - 200,
        left: 0
      }}
      dragElastic={0.1}
    >
      <div className="bg-gray-900/90 backdrop-blur-md rounded-xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-b border-gray-700">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs font-medium text-white">
              Video Call ({participants.size} {participants.size === 1 ? 'participant' : 'participants'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                {isMinimized ? (
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H7a1 1 0 01-1-1V8z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                )}
              </svg>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-white transition-colors"
              onClick={handleCloseCall} // Use enhanced close handler
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        </div>
        
        {/* Video grid container */}
        {!isMinimized && (
          <div 
            ref={videoContainerRef}
            className="grid gap-2 p-2 w-full bg-gray-900"
            style={{ 
              gridTemplateAreas: getGridTemplateAreas(),
              gridTemplateColumns: participants.size <= 1 ? '1fr' : 
                                  participants.size === 2 ? '1fr 1fr' : 
                                  participants.size <= 4 ? '1fr 1fr' : 
                                  '1fr 1fr 1fr 1fr'
            }}
          >
            <AnimatePresence>
              {Array.from(participants.values()).map((participant, index) => 
                renderParticipantVideo(participant, index)
              )}
            </AnimatePresence>
            
            {/* Placeholder if no participants */}
            {participants.size === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Connecting...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Controls */}
        <div className="bg-gray-800 border-t border-gray-700 p-2 flex justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-2 rounded-full ${audioEnabled ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-2 rounded-full ${videoEnabled ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCloseCall} // Use enhanced close handler
            className="p-2 rounded-full bg-red-600 text-white"
            title="End call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCall;
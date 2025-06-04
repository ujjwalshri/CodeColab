import { socketService } from './socket';

// ICE server configuration for STUN/TURN servers
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    }
    // Add TURN servers for production environments
    // {
    //   urls: ['turn:your-turn-server.com:443'],
    //   username: 'username',
    //   credential: 'credential'
    // }
  ],
  iceCandidatePoolSize: 10
};

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peerConnections = new Map(); // userId -> RTCPeerConnection
    this.remoteStreams = new Map(); // userId -> MediaStream
    this.roomId = null;
    this.onStreamUpdateCallback = null;
    this.onUserLeftCallCallback = null;
  }

  /**
   * Initialize the WebRTC service with callbacks for stream updates
   * @param {Function} onStreamUpdate - Callback when streams change
   * @param {Function} onUserLeftCall - Callback when a user leaves the call
   */
  initialize(onStreamUpdate, onUserLeftCall) {
    this.onStreamUpdateCallback = onStreamUpdate;
    this.onUserLeftCallCallback = onUserLeftCall;
    this.setupSignalingListeners();
  }

  /**
   * Set up all socket event listeners for WebRTC signaling
   */
  setupSignalingListeners() {
    // When someone sends us a WebRTC signal
    socketService.onSignal(({ signal, from }) => {
      const { userId, username } = from;
      
      if (signal.type === 'offer') {
        this.handleOffer(userId, username, signal);
      } else if (signal.type === 'answer') {
        this.handleAnswer(userId, signal);
      } else if (signal.candidate) {
        this.handleIceCandidate(userId, signal);
      }
    });

    // When a new user joins the call
    socketService.onUserJoinedCall(({ user }) => {
      if (this.localStream) {
        this.createPeerConnection(user.userId, user.username, true);
      }
    });

    // When a user leaves the call
    socketService.onUserLeftCall(({ user }) => {
      this.handleUserLeft(user.userId);
    });

    // When we join and the server tells us about existing users
    socketService.onAllUsersInCall(({ users }) => {
      if (this.localStream) {
        // Create peer connections with each existing user
        users.forEach(user => {
          if (user.userId !== socketService.socket.id) {
            this.createPeerConnection(user.userId, user.username, false);
          }
        });
      }
    });
  }

  /**
   * Start a video call in a specific room
   * @param {string} roomId - The room identifier
   */
  async joinCall(roomId) {
    try {
      this.roomId = roomId;
      
      // Request user media with constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      // Notify the server that we've joined the call
      socketService.joinVideoCall(roomId);
      
      // Notify callback about the local stream
      if (this.onStreamUpdateCallback) {
        this.onStreamUpdateCallback({
          userId: 'local',
          username: socketService.username,
          stream: this.localStream,
          isLocal: true
        });
      }

      return this.localStream;
    } catch (err) {
      console.error('Error joining video call:', err);
      throw err;
    }
  }

  /**
   * Leave the current video call
   */
  leaveCall() {
    if (this.roomId) {
      // Notify the server
      socketService.leaveVideoCall(this.roomId);
      
      // Clean up peer connections
      this.peerConnections.forEach((pc, userId) => {
        pc.close();
      });
      this.peerConnections.clear();
      
      // Stop all tracks in the local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      // Clear remote streams
      this.remoteStreams.clear();
      
      this.roomId = null;
    }
  }

  /**
   * Toggle the audio mute state
   * @returns {boolean} New mute state (true = muted)
   */
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return true if muted
      }
    }
    return true; // Default to muted if no track
  }

  /**
   * Toggle the video mute state
   * @returns {boolean} New video state (true = video off)
   */
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // Return true if video is off
      }
    }
    return true; // Default to video off if no track
  }

  /**
   * Create a peer connection with another user
   * @param {string} userId - Other user's ID
   * @param {string} username - Other user's name
   * @param {boolean} isInitiator - Whether we're initiating the connection
   */
  async createPeerConnection(userId, username, isInitiator) {
    try {
      if (this.peerConnections.has(userId)) {
        console.warn(`Peer connection with ${userId} already exists`);
        return;
      }

      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      this.peerConnections.set(userId, peerConnection);

      // Add local tracks to the peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendSignal(this.roomId, event.candidate, userId);
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = (event) => {
        if (peerConnection.iceConnectionState === 'disconnected' ||
            peerConnection.iceConnectionState === 'failed' ||
            peerConnection.iceConnectionState === 'closed') {
          this.handleUserLeft(userId);
        }
      };

      // Handle when remote stream arrives
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStreams.set(userId, event.streams[0]);
          
          // Notify callback about the new stream
          if (this.onStreamUpdateCallback) {
            this.onStreamUpdateCallback({
              userId,
              username,
              stream: event.streams[0],
              isLocal: false
            });
          }
        }
      };

      // If we're the initiator, create and send an offer
      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketService.sendSignal(this.roomId, peerConnection.localDescription, userId);
      }

    } catch (err) {
      console.error(`Error creating peer connection with ${userId}:`, err);
      this.handleUserLeft(userId);
    }
  }

  /**
   * Handle an incoming WebRTC offer
   * @param {string} userId - ID of the user sending the offer
   * @param {string} username - Name of the user sending the offer
   * @param {RTCSessionDescription} offer - The WebRTC offer
   */
  async handleOffer(userId, username, offer) {
    try {
      if (!this.localStream) {
        console.warn('Cannot handle offer: Local stream not ready');
        return;
      }

      // Create a peer connection if it doesn't exist
      if (!this.peerConnections.has(userId)) {
        await this.createPeerConnection(userId, username, false);
      }

      const peerConnection = this.peerConnections.get(userId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create and send an answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socketService.sendSignal(this.roomId, peerConnection.localDescription, userId);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }

  /**
   * Handle an incoming WebRTC answer
   * @param {string} userId - ID of the user sending the answer
   * @param {RTCSessionDescription} answer - The WebRTC answer
   */
  async handleAnswer(userId, answer) {
    try {
      const peerConnection = this.peerConnections.get(userId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }

  /**
   * Handle an incoming ICE candidate
   * @param {string} userId - ID of the user sending the ICE candidate
   * @param {RTCIceCandidate} candidate - The ICE candidate
   */
  async handleIceCandidate(userId, candidate) {
    try {
      const peerConnection = this.peerConnections.get(userId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }

  /**
   * Handle a user leaving the call
   * @param {string} userId - ID of the user who left
   */
  handleUserLeft(userId) {
    // Close and remove peer connection
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    // Remove remote stream
    this.remoteStreams.delete(userId);

    // Notify through the callback
    if (this.onUserLeftCallCallback) {
      this.onUserLeftCallCallback(userId);
    }
  }
}

export const webrtcService = new WebRTCService();
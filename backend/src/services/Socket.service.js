import { Server } from 'socket.io';

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
        this.activeRooms = new Map(); // Will store room state including code and language
        this.callParticipants = new Map(); // Track participants in video calls: roomId -> Set of userIds
    }

    // Initialize socket server
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                methods: ["GET", "POST"]
            }
        });

        this.setupEventHandlers();
        return this.io;
    }

    // Set up main event handlers
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);
            
            this.handleUserConnection(socket);
            this.handleRoomEvents(socket);
            this.handleCodeEvents(socket);
            this.handleWebRTCEvents(socket);
            this.handleDisconnection(socket);
        });
    }

    // Handle user connection and tracking
    handleUserConnection(socket) {
        socket.on('user:join', ({ userId, username }) => {
            this.connectedUsers.set(socket.id, { userId, username });
            socket.emit('user:joined', { success: true });
        });
    }

    // Handle room-related events
    handleRoomEvents(socket) {
        // Join room
        socket.on('room:join', ({ roomId }) => {
            socket.join(roomId);
            
            const room = this.activeRooms.get(roomId) || { 
                users: new Set(),
                code: '',
                language: '',
                fileName: '',
                terminalOutput: '' // Add terminal output to room state
            };
            room.users.add(socket.id);
            this.activeRooms.set(roomId, room);
            
            const userInfo = this.connectedUsers.get(socket.id);
            
            // Send current room state to the joining user including terminal output
            socket.emit('room:state', {
                code: room.code,
                language: room.language,
                fileName: room.fileName,
                terminalOutput: room.terminalOutput,
                users: this.getRoomUsers(roomId)
            });

            // Notify others about the new user
            this.io.to(roomId).emit('room:user-joined', { 
                userId: userInfo?.userId,
                username: userInfo?.username 
            });
            
            // Broadcast updated user list to all clients in the room
            this.broadcastRoomUsers(roomId);
        });

        // Get room users
        socket.on('room:get-users', ({ roomId }) => {
            const users = this.getRoomUsers(roomId);
            socket.emit('room:users', { users });
        });

        // Set initial room state
        socket.on('room:set-state', ({ roomId, code, language, fileName }) => {
            const room = this.activeRooms.get(roomId);
            if (room && (!room.code || !room.language)) {
                room.code = code;
                room.language = language;
                room.fileName = fileName;
                this.activeRooms.set(roomId, room);
            }
        });

        // Leave room
        socket.on('room:leave', ({ roomId }) => {
            this.handleRoomLeave(socket, roomId);
        });
    }

    // Handle WebRTC signaling for video calls
    handleWebRTCEvents(socket) {
        // Forward WebRTC signaling messages
        socket.on('webrtc:signal', ({ roomId, signal, targetUserId, from }) => {
            // Send to specific user if targetUserId is provided
            if (targetUserId) {
                this.io.to(targetUserId).emit('webrtc:signal', {
                    signal,
                    from
                });
            }
        });

        // Handle user joining a video call
        socket.on('webrtc:join-call', ({ roomId, user }) => {
            // Add user to call participants
            if (!this.callParticipants.has(roomId)) {
                this.callParticipants.set(roomId, new Set());
            }
            
            const callRoom = this.callParticipants.get(roomId);
            callRoom.add(socket.id);
            
            // Get user info from connected users
            const userInfo = this.connectedUsers.get(socket.id) || user;

            // Notify everyone in the room that this user joined
            socket.to(roomId).emit('webrtc:user-joined-call', {
                user: {
                    userId: socket.id,
                    username: userInfo?.username
                }
            });

            // Send the current users in the call to the joining user
            const usersInCall = Array.from(callRoom)
                .filter(id => id !== socket.id)
                .map(id => {
                    const user = this.connectedUsers.get(id);
                    return {
                        userId: id,
                        username: user?.username
                    };
                });
            
            socket.emit('webrtc:all-users-in-call', {
                users: usersInCall
            });
        });

        // Handle user leaving a video call
        socket.on('webrtc:leave-call', ({ roomId }) => {
            this.handleLeaveVideoCall(socket, roomId);
        });
    }

    // Handle user leaving a video call
    handleLeaveVideoCall(socket, roomId) {
        const callRoom = this.callParticipants.get(roomId);
        
        if (callRoom) {
            // Remove user from call participants
            callRoom.delete(socket.id);
            
            // If call room is now empty, remove it
            if (callRoom.size === 0) {
                this.callParticipants.delete(roomId);
            }
            
            // Get user info
            const userInfo = this.connectedUsers.get(socket.id);
            
            // Notify others in the room that this user left the call
            socket.to(roomId).emit('webrtc:user-left-call', {
                user: {
                    userId: socket.id,
                    username: userInfo?.username
                }
            });
        }
    }

    // Handle code-related events
    handleCodeEvents(socket) {
        // Code change event
        socket.on('code:change', ({ roomId, code, language }) => {
            const room = this.activeRooms.get(roomId);
            if (room) {
                room.code = code;
                room.language = language;
                this.activeRooms.set(roomId, room);
            }
            socket.to(roomId).emit('code:update', { code, language });
        });

        // Code execution state
        socket.on('code:execution-start', ({ roomId }) => {
            const room = this.activeRooms.get(roomId);
            if (room) {
                room.isExecuting = true;
                this.activeRooms.set(roomId, room);
            }
            socket.to(roomId).emit('code:execution-start');
        });

        socket.on('code:execution-end', ({ roomId, success, output }) => {
            const room = this.activeRooms.get(roomId);
            if (room) {
                room.isExecuting = false;
                room.lastOutput = output;
                this.activeRooms.set(roomId, room);
            }
            socket.to(roomId).emit('code:execution-end', { success, output });
        });

        // Code execution result
        socket.on('code:execution-result', ({ roomId, result }) => {
            socket.to(roomId).emit('code:execution-update', { result });
        });

        // Cursor position update
        socket.on('code:cursor', ({ roomId, position }) => {
            const userInfo = this.connectedUsers.get(socket.id);
            socket.to(roomId).emit('code:cursor-update', { 
                userId: userInfo?.userId,
                username: userInfo?.username,
                position 
            });
        });

        // Terminal output sync
        socket.on('terminal:output', ({ roomId, output }) => {
            // Store output in room state
            const room = this.activeRooms.get(roomId);
            if (room) {
                room.terminalOutput = output;
                this.activeRooms.set(roomId, room);
            }
            // Broadcast to other users in the room
            socket.to(roomId).emit('terminal:output-update', { output });
        });

        socket.on('terminal:clear', ({ roomId }) => {
            const room = this.activeRooms.get(roomId);
            if (room) {
                room.terminalOutput = '';
                this.activeRooms.set(roomId, room);
            }
            socket.to(roomId).emit('terminal:clear');
        });
    }

    // Handle user disconnection
    handleDisconnection(socket) {
        socket.on('disconnect', () => {
            // Clean up video calls
            this.callParticipants.forEach((participants, roomId) => {
                if (participants.has(socket.id)) {
                    this.handleLeaveVideoCall(socket, roomId);
                }
            });
            
            // Remove user from all rooms they were in
            this.activeRooms.forEach((room, roomId) => {
                if (room.users.has(socket.id)) {
                    this.handleRoomLeave(socket, roomId);
                }
            });

            // Remove user from connected users
            this.connectedUsers.delete(socket.id);
            console.log(`User disconnected: ${socket.id}`);
        });
    }

    // Helper method to handle room leaving logic
    handleRoomLeave(socket, roomId) {
        socket.leave(roomId);
        const room = this.activeRooms.get(roomId);
        
        if (room) {
            room.users.delete(socket.id);
            
            if (room.users.size === 0) {
                this.activeRooms.delete(roomId);
            } else {
                this.activeRooms.set(roomId, room);
            }

            const userInfo = this.connectedUsers.get(socket.id);
            this.io.to(roomId).emit('room:user-left', { 
                userId: userInfo?.userId,
                username: userInfo?.username 
            });
            
            // Broadcast updated user list after someone leaves
            this.broadcastRoomUsers(roomId);
        }
    }

    // Get all users in a room
    getRoomUsers(roomId) {
        const room = this.activeRooms.get(roomId);
        if (!room) return [];

        return Array.from(room.users)
            .map(socketId => {
                const user = this.connectedUsers.get(socketId);
                return user ? { userId: user.userId, username: user.username } : null;
            })
            .filter(Boolean);
    }
    
    // Broadcast updated user list to all clients in a room
    broadcastRoomUsers(roomId) {
        const users = this.getRoomUsers(roomId);
        this.io.to(roomId).emit('room:users', { users });
    }

    // Get room information
    getRoomInfo(roomId) {
        const room = this.activeRooms.get(roomId);
        if (!room) return null;

        const users = Array.from(room.users).map(socketId => {
            const user = this.connectedUsers.get(socketId);
            return user ? { userId: user.userId, username: user.username } : null;
        }).filter(Boolean);

        return { roomId, users };
    }

    // Emit event to specific room
    emitToRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
    }

    // Emit event to specific user
    emitToUser(socketId, event, data) {
        this.io.to(socketId).emit(event, data);
    }

    // Broadcast event to all users except sender
    broadcastToAll(event, data, except = null) {
        if (except) {
            this.io.except(except).emit(event, data);
        } else {
            this.io.emit(event, data);
        }
    }
}

// Export singleton instance
export const socketService = new SocketService();
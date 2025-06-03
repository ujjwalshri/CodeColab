import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.username = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');
            this.setupEventHandlers();
        }
        return this.socket;
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('Disconnected from server');
        });
    }
    
    setUsername(username) {
        this.username = username;
        if (this.socket) {
            this.socket.emit('user:join', { username });
        }
    }

    joinRoom(roomId, username) {
        if (this.socket) {
            if (username && username !== this.username) {
                this.setUsername(username);
            }
            this.socket.emit('room:join', { roomId, username: this.username });
        }
    }

    setRoomState(roomId, code, language, fileName) {
        if (this.socket) {
            this.socket.emit('room:set-state', { roomId, code, language, fileName });
        }
    }

    onRoomState(callback) {
        if (this.socket) {
            this.socket.on('room:state', callback);
        }
    }

    leaveRoom(roomId) {
        if (this.socket) {
            this.socket.emit('room:leave', { roomId });
        }
    }

    onUserJoined(callback) {
        if (this.socket) {
            this.socket.on('room:user-joined', callback);
        }
    }
    
    getRoomUsers(roomId, callback) {
        if (this.socket) {
            this.socket.emit('room:get-users', { roomId });
            this.socket.on('room:users', callback);
        }
    }

    onUserLeft(callback) {
        if (this.socket) {
            this.socket.on('room:user-left', callback);
        }
    }

    emitCodeChange(roomId, code, language) {
        if (this.socket) {
            this.socket.emit('code:change', { roomId, code, language });
        }
    }

    onCodeUpdate(callback) {
        if (this.socket) {
            this.socket.on('code:update', callback);
        }
    }

    emitCursorPosition(roomId, position) {
        if (this.socket) {
            this.socket.emit('code:cursor', { roomId, position });
        }
    }

    onCursorUpdate(callback) {
        if (this.socket) {
            this.socket.on('code:cursor-update', callback);
        }
    }

    emitTerminalOutput(roomId, output) {
        if (this.socket) {
            this.socket.emit('terminal:output', { roomId, output });
        }
    }

    onTerminalOutput(callback) {
        if (this.socket) {
            this.socket.on('terminal:output-update', callback);
        }
    }

    clearTerminal(roomId) {
        if (this.socket) {
            this.socket.emit('terminal:clear', { roomId });
        }
    }

    onTerminalClear(callback) {
        if (this.socket) {
            this.socket.on('terminal:clear', callback);
        }
    }

    emitExecutionStart(roomId) {
        if (this.socket) {
            this.socket.emit('code:execution-start', { roomId });
        }
    }

    emitExecutionEnd(roomId, success, output) {
        if (this.socket) {
            this.socket.emit('code:execution-end', { roomId, success, output });
        }
    }

    onExecutionStart(callback) {
        if (this.socket) {
            this.socket.on('code:execution-start', callback);
        }
    }

    onExecutionEnd(callback) {
        if (this.socket) {
            this.socket.on('code:execution-end', callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
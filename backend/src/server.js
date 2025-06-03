import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { socketService } from './services/Socket.service.js';
import cors from 'cors';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Initialize socket service
socketService.initialize(httpServer);

// Routes
app.get('/', (req, res) => {
  res.send('CodeColab Server Running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 3000;

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import transactionRoutes from './routes/transaction.routes';
import { verifyEmailConfig } from './utils/emailer';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from './utils/jwt';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// Global error handler — must have 4 parameters so Express recognizes it as an error handler
app.use((err: Error & { type?: string; status?: number }, req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Invalid JSON in request body' });
        return;
    }

    if (err.status === 400 || err.status === 413) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);

const io = new SocketServer(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
    },
});

// Make io available to other modules via the Express app
app.set('io', io);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const payload = verifyToken(token);
        // Attach user info to the socket for later use
        socket.data.userId = payload.userId;
        socket.data.email = payload.email;
        next();
    } catch (err) {
        next(new Error('Invalid or expired token'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, user: ${socket.data.email}`);

    // Each user joins a room named after their userId.
    // This is how we'll later send events to a specific user.
    socket.join(`user:${socket.data.userId}`);

    socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
});

server.listen(PORT, async () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    try {
        await verifyEmailConfig();
        console.log('Email configuration verified');
    } catch (err) {
        console.error('Email configuration failed:', err);
    }
});
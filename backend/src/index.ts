import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
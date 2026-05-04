import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', version: '0.1.0' });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
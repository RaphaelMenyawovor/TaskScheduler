import express, { type Request, type Response } from 'express';
import cors from 'cors';
import "dotenv/config"
import helmet from 'helmet';
import httpLogger from './utils/httpLogger.js';
import logger from './utils/logger.js';
import { prisma } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';

const app = express();

// App level middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(httpLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);









// ------- Basic Routes for testing -------
// Base route
app.get('/', (_req: Request, res: Response) => {
  logger.info('Base route hit');
  res.send('API is running');
})

// Health check
app.get('/health', (_req: Request, res: Response) => {
    logger.info('Health check route hit');
    res.json({ status: 'Server is healthy' });
});

// Db test
app.get('/db', async (_req: Request, res: Response) => {
    try {
        const count = await prisma.user.count();
        logger.info(`Database check: Found ${count} users`);
        res.json({ status: 'Database connected', userCount: count });
    } catch (error) {
        const errorMessage = (error as Error).message;
        logger.error(`Database connection failed: ${errorMessage}`);
        res.status(500).json({ error: 'Database connection failed' });
    }
});




export default app;

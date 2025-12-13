import { Router } from 'express';
import { createTask } from '../controllers/task.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, createTask);

export default router;

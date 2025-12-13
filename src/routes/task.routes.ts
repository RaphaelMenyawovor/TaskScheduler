import { Router } from 'express';
import { createTask, deleteTask, getTaskById, getTasks, updateTask } from '../controllers/task.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, createTask);
router.get('/', authenticateToken, getTasks);
router.get('/:id', authenticateToken, getTaskById);
router.patch('/:id', authenticateToken, updateTask);
router.delete('/:id', authenticateToken, deleteTask);

export default router;

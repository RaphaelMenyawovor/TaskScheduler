import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import logger from '../utils/logger.js';
import { createTaskSchema } from '../validators/task.validator.js';

export const createTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authUserId = req.user?.userId;
    const authUserEmail = req.user?.email;
    if (!authUserId) {
      logger.warn('Task creation denied: missing authenticated user');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn(`Task creation validation failed: ${JSON.stringify(parsed.error.issues)}`);
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { title, message, priority, completed: completedInput, dueDate, frequency, cronExpression } = parsed.data;

    const completed = completedInput ?? false;
    const status = completed ? 'COMPLETED' : 'PENDING';
    const completedAt = completed ? new Date() : null;

    const task = await prisma.task.create({
      data: {
        title,
        message,
        priority,
        completed,
        status,
        completedAt,
        dueDate: dueDate ? new Date(dueDate) : null,
        frequency: frequency ?? null,
        cronExpression: cronExpression ?? null,
        userId: authUserId,
      },
      select: {
        id: true,
        title: true,
        message: true,
        status: true,
        completed: true,
        completedAt: true,
        priority: true,
        dueDate: true,
        frequency: true,
        cronExpression: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Task ${task.id} created for user ${authUserEmail}`);

    return res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Task creation error: ${errorMessage}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

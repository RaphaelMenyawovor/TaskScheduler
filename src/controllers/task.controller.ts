import type { Request, Response } from 'express';
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../config/db.js';
import logger from '../utils/logger.js';
import { createTaskSchema, listTasksSchema, taskIdParamSchema, updateTaskSchema,} from '../validators/task.validator.js';

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

export const getTasks = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authUserId = req.user?.userId;
    if (!authUserId) {
      logger.warn('Task list denied: missing authenticated user');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsed = listTasksSchema.safeParse(req.query);
    if (!parsed.success) {
      logger.warn(`Task list validation failed: ${JSON.stringify(parsed.error.issues)}`);
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { status, priority, completed, dueBefore, dueAfter } = parsed.data;

    const where: Prisma.TaskWhereInput = {
      userId: authUserId,
    };

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (completed !== undefined) {
      where.completed = completed;
    }
    if (dueBefore || dueAfter) {
      where.dueDate = {
        ...(dueBefore ? { lte: new Date(dueBefore) } : {}),
        ...(dueAfter ? { gte: new Date(dueAfter) } : {}),
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
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

    return res.json({ tasks });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Task list error: ${errorMessage}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authUserId = req.user?.userId;
    if (!authUserId) {
      logger.warn('Task fetch denied: missing authenticated user');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsedParams = taskIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn(`Task fetch validation failed: ${JSON.stringify(parsedParams.error.issues)}`);
      return res.status(400).json({ error: parsedParams.error.issues });
    }

    const { id } = parsedParams.data;

    const task = await prisma.task.findFirst({
      where: { id, userId: authUserId },
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

    if (!task) {
      logger.warn(`Task fetch failed for user ${authUserId}, id ${id}: not found`);
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json({ task });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Task fetch error: ${errorMessage}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authUserId = req.user?.userId;
    if (!authUserId) {
      logger.warn('Task update denied: missing authenticated user');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsedParams = taskIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn(`Task update param validation failed: ${JSON.stringify(parsedParams.error.issues)}`);
      return res.status(400).json({ error: parsedParams.error.issues });
    }

    const parsedBody = updateTaskSchema.safeParse(req.body);
    if (!parsedBody.success) {
      logger.warn(`Task update body validation failed: ${JSON.stringify(parsedBody.error.issues)}`);
      return res.status(400).json({ error: parsedBody.error.issues });
    }

    const { id } = parsedParams.data;
    const updates = parsedBody.data;

    const existing = await prisma.task.findFirst({
      where: { id, userId: authUserId },
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
      },
    });

    if (!existing) {
      logger.warn(`Task update failed for user ${authUserId}, id ${id}: not found`);
      return res.status(404).json({ error: 'Task not found' });
    }

    let nextStatus = updates.status ?? existing.status;
    let nextCompleted = updates.completed ?? existing.completed;
    let nextCompletedAt = existing.completedAt;

    if (updates.status !== undefined && updates.completed === undefined) {
      if (updates.status === 'COMPLETED') {
        nextCompleted = true;
        nextCompletedAt = new Date();
      } else if (existing.completed) {
        nextCompleted = false;
        nextCompletedAt = null;
      }
    }

    if (updates.completed !== undefined) {
      if (updates.completed) {
        nextCompleted = true;
        nextStatus = 'COMPLETED';
        nextCompletedAt = new Date();
      } else {
        nextCompleted = false;
        nextCompletedAt = null;
        if (nextStatus === 'COMPLETED') {
          nextStatus = 'PENDING';
        }
      }
    }

    const data: Prisma.TaskUpdateInput = {};

    if (updates.title !== undefined) data.title = updates.title;
    if (updates.message !== undefined) data.message = updates.message;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.frequency !== undefined) data.frequency = updates.frequency;
    if (updates.cronExpression !== undefined) data.cronExpression = updates.cronExpression;

    if (nextStatus !== existing.status) data.status = nextStatus;
    if (nextCompleted !== existing.completed) data.completed = nextCompleted;
    if (nextCompletedAt !== existing.completedAt) data.completedAt = nextCompletedAt;

    const task = await prisma.task.update({
      where: { id: existing.id },
      data,
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

    logger.info(`Task updated for user ${authUserId}: ${task.id}`);

    return res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Task update error: ${errorMessage}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authUserId = req.user?.userId;
    if (!authUserId) {
      logger.warn('Task delete denied: missing authenticated user');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsedParams = taskIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn(`Task delete param validation failed: ${JSON.stringify(parsedParams.error.issues)}`);
      return res.status(400).json({ error: parsedParams.error.issues });
    }

    const { id } = parsedParams.data;

    const result = await prisma.task.deleteMany({
      where: { id, userId: authUserId },
    });

    if (result.count === 0) {
      logger.warn(`Task delete failed for user ${authUserId}, id ${id}: not found`);
      return res.status(404).json({ error: 'Task not found' });
    }

    logger.info(`Task deleted for user ${authUserId}: ${id}`);

    return res.status(204).send();
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Task delete error: ${errorMessage}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

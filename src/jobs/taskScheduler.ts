import cron, { type TaskOptions } from 'node-cron';
import { prisma } from '../config/db.js';
import logger from '../utils/logger.js';
import { getNextDueDate } from '../utils/frequency.js';
import "dotenv/config";

const SCHEDULER_ENABLED = process.env.TASK_SCHEDULER_ENABLED !== 'false';
const SCHEDULER_CRON = process.env.TASK_SCHEDULER_CRON ?? '*/5 * * * *';
const SCHEDULER_TZ = process.env.TASK_SCHEDULER_TZ ?? "UTC";


type DueTask = {
  id: number;
  userId: number;
  title: string;
  message: string;
  dueDate: Date | null;
  frequency: string | null;
};

const sendTaskMessage = async (task: DueTask) => {
  // just logs for now
  logger.info(`Dispatching task ${task.id} for user ${task.userId}: ${task.title} - ${task.message}`);
};

const handleDueTask = async (task: DueTask) => {
  await sendTaskMessage(task);

  if (task.frequency && task.dueDate) {
    const nextDueDate = getNextDueDate(task.frequency, task.dueDate);
    if (nextDueDate) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          dueDate: nextDueDate,
          status: 'PENDING',
          completed: false,
          completedAt: null,
        },
      });
      return;
    }
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status: 'COMPLETED',
      completed: true,
      completedAt: new Date(),
    },
  });
};

let isRunning = false;


export const runTaskDispatch = async (): Promise<void> => {
  if (isRunning) {
    logger.warn('Task scheduler skipped. Previous run still in progress');
    return;
  }

  isRunning = true;
  const started = Date.now();
  try {
    const now = new Date();
    const dueTasks = await prisma.task.findMany({
      where: {
        completed: false,
        dueDate: { lte: now },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        dueDate: true,
        frequency: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });

    if (dueTasks.length === 0) {
      return;
    }

    logger.info(`Task scheduler found ${dueTasks.length} due task(s)`);

    for (const task of dueTasks) {
      await handleDueTask(task);
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Task scheduler run failed: ${errorMessage}`);
  } finally {
    isRunning = false;
    logger.debug(`Task scheduler run completed: ${Date.now() - started}ms`);
  }
};

export const startTaskScheduler = (): void => {
  if (!SCHEDULER_ENABLED) {
    logger.info('Task scheduler disabled via TASK_SCHEDULER_ENABLED=false');
    return;
  }

  if (!cron.validate(SCHEDULER_CRON)) {
    logger.error(`Invalid TASK_SCHEDULER_CRON: ${SCHEDULER_CRON}`);
    return;
  }

  const options: TaskOptions = { name: 'task-dispatcher' };
  if (SCHEDULER_TZ) {
    options.timezone = SCHEDULER_TZ;
  }

  cron.schedule(SCHEDULER_CRON, runTaskDispatch, options);

  logger.info(
    `Task scheduler started: CronScheduler=(${SCHEDULER_CRON})${SCHEDULER_TZ ? `, tz=${SCHEDULER_TZ}` : ''}`
  );
};

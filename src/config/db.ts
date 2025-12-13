import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js'; 
import logger from '../utils/logger.js';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

pool.on('connect', () => {
  logger.info('Postgres Pool Connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});
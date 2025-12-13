import express, { type Request, type Response } from 'express'
import "dotenv/config"
import helmet from 'helmet'
import httpLogger from './utils/httpLogger.js'
import logger from './utils/logger.js'


const app = express()

// App level middlewares
app.use(express.json())
app.use(helmet())
app.use(httpLogger)

// Routes

// Server Health check
app.get('/', (_req: Request, res: Response) => {
  logger.info('Health check route hit')
  res.json({ status: 'API is running' })
})



export default app
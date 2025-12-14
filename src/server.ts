import app from './app.js';
import logger from './utils/logger.js';
import "dotenv/config";
import { startTaskScheduler } from './jobs/taskScheduler.js';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    startTaskScheduler();
})

import app from './app.js'
import logger from './utils/logger.js'
import "dotenv/config"

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    logger.info(`\nServer is running on port ${PORT}`)
})
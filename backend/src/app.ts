import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'

import { env } from './config/env.js'
import { openApiDocument } from './docs/openapi.js'
import { healthRouter } from './routes/health.js'

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
)
app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))
app.use('/api/health', healthRouter)

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' })
})

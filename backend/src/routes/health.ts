import { Router } from 'express'

export const healthRouter = Router()

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Verifica se a API esta disponivel
 *     responses:
 *       200:
 *         description: API disponivel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
healthRouter.get('/', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

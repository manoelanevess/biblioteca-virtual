import { Router } from 'express'

import { obterDashboard } from '../dashboard/servico-dashboard.js'
import { PerfilUsuario } from '../generated/prisma/enums.js'
import {
  exigirAutenticacao,
  exigirPerfis,
} from '../middleware/autenticacao.js'
import { consultarDashboardSchema } from '../schemas/dashboard.js'

export const dashboardRouter = Router()

dashboardRouter.use(
  exigirAutenticacao,
  exigirPerfis(PerfilUsuario.VENDEDOR, PerfilUsuario.ADMINISTRADOR),
)

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Exibe os indicadores da area restrita
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meses
 *         schema:
 *           type: integer
 *           minimum: 3
 *           maximum: 12
 *           default: 6
 *     responses:
 *       200:
 *         description: Indicadores e graficos carregados
 *       401:
 *         description: Autenticacao necessaria
 *       403:
 *         description: Perfil sem permissao
 */
dashboardRouter.get('/', async (request, response) => {
  const { meses } = consultarDashboardSchema.parse(request.query)
  const usuario = request.usuarioAutenticado!
  const dashboard = await obterDashboard(
    usuario.usuarioId,
    usuario.perfil,
    meses,
  )

  response.status(200).json({ dashboard })
})

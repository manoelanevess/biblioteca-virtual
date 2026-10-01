import { Router } from 'express'

import {
  excluirAvaliacao,
  listarAvaliacoesDoLivro,
  listarAvaliacoesDoUsuario,
  listarAvaliacoesGerenciadas,
  responderAvaliacao,
  salvarAvaliacao,
} from '../avaliacoes/servico-avaliacoes.js'
import { PerfilUsuario } from '../generated/prisma/enums.js'
import {
  exigirAutenticacao,
  exigirPerfis,
} from '../middleware/autenticacao.js'
import {
  avaliacaoIdParametroSchema,
  livroAvaliacaoParametroSchema,
  responderAvaliacaoSchema,
  salvarAvaliacaoSchema,
} from '../schemas/avaliacoes.js'

export const avaliacoesRouter = Router()

/**
 * @openapi
 * /api/avaliacoes/livros/{livroId}:
 *   get:
 *     tags: [Avaliacoes]
 *     summary: Lista as avaliacoes publicas de um livro
 *     parameters:
 *       - in: path
 *         name: livroId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Avaliacoes carregadas
 */
avaliacoesRouter.get('/livros/:livroId', async (request, response) => {
  const { livroId } = livroAvaliacaoParametroSchema.parse(request.params)
  const avaliacoes = await listarAvaliacoesDoLivro(livroId)

  response.status(200).json({ avaliacoes })
})

avaliacoesRouter.use(exigirAutenticacao)

/**
 * @openapi
 * /api/avaliacoes/minhas:
 *   get:
 *     tags: [Avaliacoes]
 *     summary: Lista as avaliacoes do cliente autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avaliacoes do cliente carregadas
 */
avaliacoesRouter.get(
  '/minhas',
  exigirPerfis(PerfilUsuario.CLIENTE),
  async (request, response) => {
    const avaliacoes = await listarAvaliacoesDoUsuario(
      request.usuarioAutenticado!.usuarioId,
    )

    response.status(200).json({ avaliacoes })
  },
)

/**
 * @openapi
 * /api/avaliacoes/livros/{livroId}:
 *   put:
 *     tags: [Avaliacoes]
 *     summary: Cria ou atualiza a avaliacao do cliente para um livro
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: livroId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nota]
 *             properties:
 *               nota:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avaliacao salva
 */
avaliacoesRouter.put(
  '/livros/:livroId',
  exigirPerfis(PerfilUsuario.CLIENTE),
  async (request, response) => {
    const { livroId } = livroAvaliacaoParametroSchema.parse(request.params)
    const entrada = salvarAvaliacaoSchema.parse(request.body)
    const avaliacao = await salvarAvaliacao(
      request.usuarioAutenticado!.usuarioId,
      livroId,
      entrada,
    )

    response.status(200).json({ avaliacao })
  },
)

/**
 * @openapi
 * /api/avaliacoes/gerenciamento:
 *   get:
 *     tags: [Avaliacoes]
 *     summary: Lista avaliacoes para a area restrita
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avaliacoes carregadas
 */
avaliacoesRouter.get(
  '/gerenciamento',
  exigirPerfis(PerfilUsuario.VENDEDOR, PerfilUsuario.ADMINISTRADOR),
  async (request, response) => {
    const usuario = request.usuarioAutenticado!
    const avaliacoes = await listarAvaliacoesGerenciadas(
      usuario.usuarioId,
      usuario.perfil,
    )

    response.status(200).json({ avaliacoes })
  },
)

/**
 * @openapi
 * /api/avaliacoes/{avaliacaoId}/resposta:
 *   patch:
 *     tags: [Avaliacoes]
 *     summary: Responde uma avaliacao na area restrita
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resposta salva
 */
avaliacoesRouter.patch(
  '/:avaliacaoId/resposta',
  exigirPerfis(PerfilUsuario.VENDEDOR, PerfilUsuario.ADMINISTRADOR),
  async (request, response) => {
    const { avaliacaoId } = avaliacaoIdParametroSchema.parse(request.params)
    const entrada = responderAvaliacaoSchema.parse(request.body)
    const usuario = request.usuarioAutenticado!
    const avaliacao = await responderAvaliacao(
      usuario.usuarioId,
      usuario.perfil,
      avaliacaoId,
      entrada,
    )

    response.status(200).json({ avaliacao })
  },
)

/**
 * @openapi
 * /api/avaliacoes/{avaliacaoId}:
 *   delete:
 *     tags: [Avaliacoes]
 *     summary: Exclui uma avaliacao na area restrita
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Avaliacao excluida
 */
avaliacoesRouter.delete(
  '/:avaliacaoId',
  exigirPerfis(PerfilUsuario.VENDEDOR, PerfilUsuario.ADMINISTRADOR),
  async (request, response) => {
    const { avaliacaoId } = avaliacaoIdParametroSchema.parse(request.params)
    const usuario = request.usuarioAutenticado!
    await excluirAvaliacao(
      usuario.usuarioId,
      usuario.perfil,
      avaliacaoId,
    )

    response.status(204).send()
  },
)

import { Router } from 'express'

import {
  atualizarProgresso,
  listarBiblioteca,
} from '../biblioteca/servico-biblioteca.js'
import { exigirAutenticacao } from '../middleware/autenticacao.js'
import {
  atualizarProgressoSchema,
  itemBibliotecaIdParametroSchema,
} from '../schemas/biblioteca.js'

export const bibliotecaRouter = Router()

bibliotecaRouter.use(exigirAutenticacao)

/**
 * @openapi
 * /api/biblioteca:
 *   get:
 *     tags: [Biblioteca]
 *     summary: Lista os livros da biblioteca do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Biblioteca pessoal carregada
 *       401:
 *         description: Autenticacao necessaria
 */
bibliotecaRouter.get('/', async (request, response) => {
  const itens = await listarBiblioteca(request.usuarioAutenticado!.usuarioId)

  response.status(200).json({ itens })
})

/**
 * @openapi
 * /api/biblioteca/{itemBibliotecaId}/progresso:
 *   patch:
 *     tags: [Biblioteca]
 *     summary: Atualiza o progresso de leitura de um livro da biblioteca
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemBibliotecaId
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
 *             required: [statusLeitura, percentualLido]
 *             properties:
 *               statusLeitura:
 *                 type: string
 *                 enum: [NAO_INICIADO, LENDO, CONCLUIDO]
 *               percentualLido:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               paginaAtual:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Progresso atualizado
 *       400:
 *         description: Progresso ou pagina atual invalidos
 *       401:
 *         description: Autenticacao necessaria
 *       404:
 *         description: Livro nao encontrado na biblioteca do usuario
 */
bibliotecaRouter.patch(
  '/:itemBibliotecaId/progresso',
  async (request, response) => {
    const { itemBibliotecaId } = itemBibliotecaIdParametroSchema.parse(
      request.params,
    )
    const entrada = atualizarProgressoSchema.parse(request.body)
    const item = await atualizarProgresso(
      request.usuarioAutenticado!.usuarioId,
      itemBibliotecaId,
      entrada,
    )

    response.status(200).json({ item })
  },
)

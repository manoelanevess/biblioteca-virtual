import { Router } from 'express'

import {
  listarCategorias,
  listarLivros,
  obterLivro,
} from '../catalogo/servico-catalogo.js'
import {
  listarLivrosSchema,
  livroIdParametroSchema,
} from '../schemas/catalogo.js'

export const catalogoRouter = Router()

/**
 * @openapi
 * /api/catalogo/livros:
 *   get:
 *     tags: [Catalogo]
 *     summary: Lista livros disponiveis para compra
 *     parameters:
 *       - in: query
 *         name: termo
 *         schema:
 *           type: string
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [FISICO, EBOOK]
 *       - in: query
 *         name: categoriaId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Catalogo paginado
 */
catalogoRouter.get('/livros', async (request, response) => {
  const entrada = listarLivrosSchema.parse(request.query)
  const resultado = await listarLivros(entrada)

  response.status(200).json(resultado)
})

/**
 * @openapi
 * /api/catalogo/livros/{livroId}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Retorna os detalhes de um livro disponivel
 *     parameters:
 *       - in: path
 *         name: livroId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalhes do livro e suas ofertas
 *       404:
 *         description: Livro nao encontrado
 */
catalogoRouter.get('/livros/:livroId', async (request, response) => {
  const { livroId } = livroIdParametroSchema.parse(request.params)
  const livro = await obterLivro(livroId)

  response.status(200).json({ livro })
})

/**
 * @openapi
 * /api/catalogo/categorias:
 *   get:
 *     tags: [Catalogo]
 *     summary: Lista categorias com livros disponiveis
 *     responses:
 *       200:
 *         description: Categorias do catalogo
 */
catalogoRouter.get('/categorias', async (_request, response) => {
  const categorias = await listarCategorias()

  response.status(200).json({ categorias })
})

import { Router } from 'express'

import {
  alterarDestaqueLivro,
  alterarStatusOferta,
  criarAutor,
  criarCategoria,
  criarEdicao,
  criarLivro,
  criarOferta,
  listarOfertasDoVendedor,
  listarReferenciasCatalogo,
} from '../catalogo/servico-gerenciamento.js'
import { PerfilUsuario } from '../generated/prisma/enums.js'
import { sugerirDadosLivro } from '../ia/servico-enriquecimento-livro.js'
import {
  exigirAutenticacao,
  exigirPerfis,
} from '../middleware/autenticacao.js'
import {
  alterarDestaqueLivroSchema,
  alterarStatusOfertaSchema,
  criarAutorSchema,
  criarCategoriaSchema,
  criarEdicaoSchema,
  criarLivroSchema,
  criarOfertaSchema,
  livroIdParametroSchema,
  ofertaIdParametroSchema,
} from '../schemas/catalogo.js'
import { solicitarSugestaoLivroSchema } from '../schemas/ia.js'

export const gerenciamentoCatalogoRouter = Router()

gerenciamentoCatalogoRouter.use(
  exigirAutenticacao,
  exigirPerfis(PerfilUsuario.VENDEDOR, PerfilUsuario.ADMINISTRADOR),
)

/**
 * @openapi
 * /api/gerenciamento/catalogo/referencias:
 *   get:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Lista autores, categorias, livros e edicoes para os formularios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referencias cadastradas
 *       401:
 *         description: Autenticacao necessaria
 *       403:
 *         description: Perfil sem permissao
 */
gerenciamentoCatalogoRouter.get('/referencias', async (_request, response) => {
  const referencias = await listarReferenciasCatalogo()
  response.status(200).json(referencias)
})

/**
 * @openapi
 * /api/gerenciamento/catalogo/livros/sugestao-ia:
 *   post:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Sugere dados para o cadastro de um livro usando IA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo]
 *             properties:
 *               titulo:
 *                 type: string
 *               autor:
 *                 type: string
 *               isbn:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sugestao gerada para revisao do vendedor
 *       400:
 *         description: Dados da consulta invalidos
 *       502:
 *         description: Servico de IA indisponivel
 *       503:
 *         description: Chave da IA nao configurada
 */
gerenciamentoCatalogoRouter.post(
  '/livros/sugestao-ia',
  async (request, response) => {
    const sugestao = await sugerirDadosLivro(
      solicitarSugestaoLivroSchema.parse(request.body),
    )
    response.status(200).json({ sugestao })
  },
)

/**
 * @openapi
 * /api/gerenciamento/catalogo/autores:
 *   post:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Cadastra um autor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *               biografia:
 *                 type: string
 *     responses:
 *       201:
 *         description: Autor cadastrado
 *       409:
 *         description: Autor ja cadastrado
 */
gerenciamentoCatalogoRouter.post('/autores', async (request, response) => {
  const autor = await criarAutor(criarAutorSchema.parse(request.body))
  response.status(201).json({ autor })
})

/**
 * @openapi
 * /api/gerenciamento/catalogo/categorias:
 *   post:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Cadastra uma categoria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoria cadastrada
 *       409:
 *         description: Categoria ja cadastrada
 */
gerenciamentoCatalogoRouter.post('/categorias', async (request, response) => {
  const categoria = await criarCategoria(
    criarCategoriaSchema.parse(request.body),
  )
  response.status(201).json({ categoria })
})

/**
 * @openapi
 * /api/gerenciamento/catalogo/livros:
 *   post:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Cadastra os dados gerais de um livro
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, autorIds, categoriaIds]
 *             properties:
 *               titulo:
 *                 type: string
 *               sinopse:
 *                 type: string
 *               urlCapa:
 *                 type: string
 *                 format: uri
 *               idioma:
 *                 type: string
 *               destaque:
 *                 type: boolean
 *                 default: false
 *               autorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               categoriaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Livro cadastrado
 */
gerenciamentoCatalogoRouter.post('/livros', async (request, response) => {
  const livro = await criarLivro(criarLivroSchema.parse(request.body))
  response.status(201).json({ livro })
})

/**
 * @openapi
 * /api/gerenciamento/catalogo/livros/{livroId}/destaque:
 *   patch:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Define se um livro aparece nos destaques
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
 *             required: [destaque]
 *             properties:
 *               destaque:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Destaque atualizado
 *       404:
 *         description: Livro nao encontrado
 */
gerenciamentoCatalogoRouter.patch(
  '/livros/:livroId/destaque',
  async (request, response) => {
    const { livroId } = livroIdParametroSchema.parse(request.params)
    const livro = await alterarDestaqueLivro(
      livroId,
      alterarDestaqueLivroSchema.parse(request.body),
    )
    response.status(200).json({ livro })
  },
)

/**
 * @openapi
 * /api/gerenciamento/catalogo/edicoes:
 *   post:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Cadastra uma edicao fisica ou digital
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [livroId, formato]
 *             properties:
 *               livroId:
 *                 type: string
 *                 format: uuid
 *               isbn:
 *                 type: string
 *               formato:
 *                 type: string
 *                 enum: [FISICO, EBOOK]
 *               editora:
 *                 type: string
 *               anoPublicacao:
 *                 type: integer
 *               numeroPaginas:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Edicao cadastrada
 *       409:
 *         description: ISBN ja cadastrado
 */
gerenciamentoCatalogoRouter.post('/edicoes', async (request, response) => {
  const edicao = await criarEdicao(criarEdicaoSchema.parse(request.body))
  response.status(201).json({ edicao })
})

/**
 * @openapi
 * /api/gerenciamento/catalogo/ofertas:
 *   get:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Lista as ofertas do vendedor autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ofertas do vendedor
 *   post:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Cria uma oferta em rascunho
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [edicaoId, formato, preco]
 *             properties:
 *               edicaoId:
 *                 type: string
 *                 format: uuid
 *               formato:
 *                 type: string
 *                 enum: [FISICO, EBOOK]
 *               preco:
 *                 type: number
 *               precoAluguel:
 *                 type: number
 *                 description: Valor opcional para aluguel por 14 dias
 *               estoque:
 *                 type: integer
 *               chaveArquivoDigital:
 *                 type: string
 *     responses:
 *       201:
 *         description: Oferta criada como rascunho
 *       409:
 *         description: O vendedor ja possui uma oferta para a edicao
 */
gerenciamentoCatalogoRouter.get('/ofertas', async (request, response) => {
  const ofertas = await listarOfertasDoVendedor(
    request.usuarioAutenticado!.usuarioId,
  )
  response.status(200).json({ ofertas })
})

gerenciamentoCatalogoRouter.post('/ofertas', async (request, response) => {
  const oferta = await criarOferta(
    request.usuarioAutenticado!.usuarioId,
    criarOfertaSchema.parse(request.body),
  )
  response.status(201).json({ oferta })
})

/**
 * @openapi
 * /api/gerenciamento/catalogo/ofertas/{ofertaId}/status:
 *   patch:
 *     tags: [Gerenciamento do catalogo]
 *     summary: Altera a publicacao de uma oferta do vendedor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ofertaId
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [RASCUNHO, ATIVA, INATIVA]
 *     responses:
 *       200:
 *         description: Status atualizado
 *       404:
 *         description: Oferta nao encontrada para o vendedor
 */
gerenciamentoCatalogoRouter.patch(
  '/ofertas/:ofertaId/status',
  async (request, response) => {
    const { ofertaId } = ofertaIdParametroSchema.parse(request.params)
    const oferta = await alterarStatusOferta(
      request.usuarioAutenticado!.usuarioId,
      ofertaId,
      alterarStatusOfertaSchema.parse(request.body),
    )
    response.status(200).json({ oferta })
  },
)

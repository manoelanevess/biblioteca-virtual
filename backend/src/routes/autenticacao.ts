import { Router } from 'express'

import {
  ativarPerfilVendedor,
  entrar,
  obterUsuarioAutenticado,
  registrarUsuario,
} from '../auth/servico-autenticacao.js'
import { exigirAutenticacao } from '../middleware/autenticacao.js'
import {
  entrarSchema,
  registrarUsuarioSchema,
} from '../schemas/autenticacao.js'

export const autenticacaoRouter = Router()

/**
 * @openapi
 * /api/autenticacao/registro:
 *   post:
 *     tags: [Autenticacao]
 *     summary: Cria uma conta de cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Maria Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@example.com
 *               senha:
 *                 type: string
 *                 format: password
 *                 example: leitura123
 *     responses:
 *       201:
 *         description: Conta criada
 *       400:
 *         description: Dados invalidos
 *       409:
 *         description: Email ja cadastrado
 */
autenticacaoRouter.post('/registro', async (request, response) => {
  const entrada = registrarUsuarioSchema.parse(request.body)
  const resultado = await registrarUsuario(entrada)

  response.status(201).json(resultado)
})

/**
 * @openapi
 * /api/autenticacao/login:
 *   post:
 *     tags: [Autenticacao]
 *     summary: Autentica um usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               senha:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login realizado
 *       400:
 *         description: Dados invalidos
 *       401:
 *         description: Credenciais invalidas
 */
autenticacaoRouter.post('/login', async (request, response) => {
  const entrada = entrarSchema.parse(request.body)
  const resultado = await entrar(entrada)

  response.status(200).json(resultado)
})

/**
 * @openapi
 * /api/autenticacao/me:
 *   get:
 *     tags: [Autenticacao]
 *     summary: Retorna o usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *       401:
 *         description: Token ausente ou invalido
 */
autenticacaoRouter.get('/me', exigirAutenticacao, async (request, response) => {
  const usuario = await obterUsuarioAutenticado(
    request.usuarioAutenticado!.usuarioId,
  )

  response.status(200).json({ usuario })
})

/**
 * @openapi
 * /api/autenticacao/perfil-vendedor:
 *   post:
 *     tags: [Autenticacao]
 *     summary: Ativa o perfil de vendedor na conta autenticada
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil ativado e novo token emitido
 *       401:
 *         description: Token ausente ou invalido
 *       409:
 *         description: O perfil atual nao pode ser alterado
 */
autenticacaoRouter.post(
  '/perfil-vendedor',
  exigirAutenticacao,
  async (request, response) => {
    const resultado = await ativarPerfilVendedor(
      request.usuarioAutenticado!.usuarioId,
    )

    response.status(200).json(resultado)
  },
)

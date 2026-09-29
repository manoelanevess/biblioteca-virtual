import { Router } from 'express'

import { exigirAutenticacao } from '../middleware/autenticacao.js'
import { criarPedido } from '../pedidos/servico-pedidos.js'
import { criarPedidoSchema } from '../schemas/pedidos.js'

export const pedidosRouter = Router()

pedidosRouter.use(exigirAutenticacao)

/**
 * @openapi
 * /api/pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Compra livros de um unico vendedor
 *     description: O pagamento e aprovado automaticamente nesta versao do projeto.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendedorId, itens]
 *             properties:
 *               vendedorId:
 *                 type: string
 *                 format: uuid
 *               itens:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [ofertaId]
 *                   properties:
 *                     ofertaId:
 *                       type: string
 *                       format: uuid
 *                     quantidade:
 *                       type: integer
 *                       minimum: 1
 *                       default: 1
 *               enderecoEntrega:
 *                 type: object
 *                 properties:
 *                   destinatario:
 *                     type: string
 *                   cep:
 *                     type: string
 *                   logradouro:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   complemento:
 *                     type: string
 *                   bairro:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   estado:
 *                     type: string
 *     responses:
 *       201:
 *         description: Pedido pago e livros adicionados a biblioteca
 *       400:
 *         description: Dados ou regras da compra invalidos
 *       401:
 *         description: Autenticacao necessaria
 *       404:
 *         description: Oferta nao encontrada
 *       409:
 *         description: Oferta ou estoque indisponivel
 */
pedidosRouter.post('/', async (request, response) => {
  const pedido = await criarPedido(
    request.usuarioAutenticado!.usuarioId,
    criarPedidoSchema.parse(request.body),
  )

  response.status(201).json({ pedido })
})

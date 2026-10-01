import { Router } from 'express'

import { exigirAutenticacao } from '../middleware/autenticacao.js'
import {
  criarPedido,
  devolverAluguel,
} from '../pedidos/servico-pedidos.js'
import {
  criarPedidoSchema,
  pedidoIdParametroSchema,
} from '../schemas/pedidos.js'

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
 *               tipo:
 *                 type: string
 *                 enum: [COMPRA, ALUGUEL]
 *                 default: COMPRA
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

/**
 * @openapi
 * /api/pedidos/{pedidoId}/devolucao:
 *   post:
 *     tags: [Pedidos]
 *     summary: Devolve os itens de um aluguel do cliente autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pedidoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Aluguel devolvido e estoque fisico atualizado
 *       401:
 *         description: Autenticacao necessaria
 *       404:
 *         description: Aluguel nao encontrado
 *       409:
 *         description: Aluguel ja devolvido
 */
pedidosRouter.post('/:pedidoId/devolucao', async (request, response) => {
  const { pedidoId } = pedidoIdParametroSchema.parse(request.params)
  const pedido = await devolverAluguel(
    request.usuarioAutenticado!.usuarioId,
    pedidoId,
  )

  response.status(200).json({ pedido })
})

import { z } from 'zod'

const idSchema = z.string().uuid()

export const enderecoEntregaSchema = z
  .object({
    destinatario: z.string().trim().min(1).max(160),
    cep: z.string().trim().regex(/^\d{8}$/, 'O CEP deve ter 8 digitos'),
    logradouro: z.string().trim().min(1).max(200),
    numero: z.string().trim().min(1).max(20),
    complemento: z.string().trim().max(120).optional(),
    bairro: z.string().trim().min(1).max(120),
    cidade: z.string().trim().min(1).max(120),
    estado: z.string().trim().length(2).toUpperCase(),
  })
  .strict()

const itemPedidoSchema = z
  .object({
    ofertaId: idSchema,
    quantidade: z.number().int().positive().max(99).default(1),
  })
  .strict()

export const criarPedidoSchema = z
  .object({
    vendedorId: idSchema,
    itens: z.array(itemPedidoSchema).min(1).max(50),
    enderecoEntrega: enderecoEntregaSchema.optional(),
  })
  .strict()
  .refine(
    ({ itens }) =>
      new Set(itens.map(({ ofertaId }) => ofertaId)).size === itens.length,
    {
      message: 'Nao repita a mesma oferta no pedido',
      path: ['itens'],
    },
  )

export function ofertasPertencemAoVendedor(
  vendedorId: string,
  ofertas: readonly { vendedorId: string }[],
) {
  return ofertas.every((oferta) => oferta.vendedorId === vendedorId)
}


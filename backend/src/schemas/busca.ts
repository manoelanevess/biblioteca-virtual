import { z } from 'zod'

export const buscarLivrosSchema = z
  .object({
    termo: z.string().trim().min(2).max(300),
    modo: z.enum(['TRADICIONAL', 'INTELIGENTE']).default('TRADICIONAL'),
    formato: z.enum(['FISICO', 'EBOOK']).optional(),
    categoriaIds: z.array(z.string().uuid()).max(20).optional(),
    precoMaximo: z.number().finite().nonnegative().optional(),
  })
  .strict()


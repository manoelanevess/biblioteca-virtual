import { z } from 'zod'

const uuidSchema = z.uuid()

export const livroAvaliacaoParametroSchema = z.object({
  livroId: uuidSchema,
})

export const avaliacaoIdParametroSchema = z.object({
  avaliacaoId: uuidSchema,
})

export const salvarAvaliacaoSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((comentario) => comentario || null),
})

export const responderAvaliacaoSchema = z.object({
  resposta: z.string().trim().min(2).max(1000),
})

export type SalvarAvaliacaoEntrada = z.infer<typeof salvarAvaliacaoSchema>
export type ResponderAvaliacaoEntrada = z.infer<
  typeof responderAvaliacaoSchema
>

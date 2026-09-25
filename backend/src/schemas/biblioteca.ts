import { z } from 'zod'

const idSchema = z.string().uuid()

export const atualizarProgressoSchema = z
  .object({
    statusLeitura: z.enum(['NAO_INICIADO', 'LENDO', 'CONCLUIDO']),
    percentualLido: z.number().int().min(0).max(100),
    paginaAtual: z.number().int().min(0).nullable().optional(),
  })
  .strict()
  .superRefine(({ statusLeitura, percentualLido }, contexto) => {
    if (statusLeitura === 'NAO_INICIADO' && percentualLido !== 0) {
      contexto.addIssue({
        code: 'custom',
        message: 'Uma leitura nao iniciada deve estar em 0%',
        path: ['percentualLido'],
      })
    }

    if (statusLeitura === 'CONCLUIDO' && percentualLido !== 100) {
      contexto.addIssue({
        code: 'custom',
        message: 'Uma leitura concluida deve estar em 100%',
        path: ['percentualLido'],
      })
    }
  })

export const avaliarLivroSchema = z
  .object({
    livroId: idSchema,
    nota: z.number().int().min(1).max(5),
    comentario: z.string().trim().max(2000).optional(),
  })
  .strict()

export const alterarFavoritoSchema = z
  .object({
    livroId: idSchema,
  })
  .strict()


import { z } from 'zod'

const isbnSchema = z
  .string()
  .trim()
  .transform((isbn) => isbn.replace(/[ -]/g, ''))
  .refine((isbn) => /^(?:\d{10}|\d{13})$/.test(isbn), {
    message: 'O ISBN deve ter 10 ou 13 digitos',
  })

export const solicitarSugestaoLivroSchema = z
  .object({
    titulo: z.string().trim().min(2).max(200),
    autor: z.string().trim().min(2).max(160).optional(),
    isbn: isbnSchema.optional(),
  })
  .strict()

export const sugestaoLivroIaSchema = z
  .object({
    autorSugerido: z.string().trim().min(2).max(160),
    sinopse: z.string().trim().min(50).max(2000),
    categoriaSugerida: z.string().trim().min(2).max(100),
    idioma: z.string().trim().min(2).max(10),
  })
  .strict()

export type SolicitarSugestaoLivroEntrada = z.infer<
  typeof solicitarSugestaoLivroSchema
>

export type SugestaoLivroIa = z.infer<typeof sugestaoLivroIaSchema>

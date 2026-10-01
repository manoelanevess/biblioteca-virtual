import { z } from 'zod'

const anoLimite = new Date().getFullYear() + 1

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
    formatos: z
      .array(z.enum(['FISICO', 'EBOOK']))
      .min(1)
      .max(2)
      .refine((formatos) => new Set(formatos).size === formatos.length, {
        message: 'Nao repita formatos',
      })
      .default(['FISICO']),
  })
  .strict()

export const sugestaoLivroIaSchema = z
  .object({
    autorSugerido: z.string().trim().min(2).max(160),
    sinopse: z.string().trim().min(50).max(2000),
    categoriaSugerida: z.string().trim().min(2).max(100),
    idioma: z.string().trim().min(2).max(10),
    editoraSugerida: z.string().trim().min(1).max(160).nullable(),
    anoPublicacaoSugerido: z
      .number()
      .int()
      .min(1450)
      .max(anoLimite)
      .nullable(),
    numeroPaginasSugerido: z
      .number()
      .int()
      .positive()
      .max(100_000)
      .nullable(),
  })
  .strict()

export type SolicitarSugestaoLivroEntrada = z.infer<
  typeof solicitarSugestaoLivroSchema
>

export type SugestaoLivroIa = z.infer<typeof sugestaoLivroIaSchema>

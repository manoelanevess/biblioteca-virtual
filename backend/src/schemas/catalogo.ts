import { z } from 'zod'

const idSchema = z.string().uuid()
const textoObrigatorioSchema = z.string().trim().min(1)
const anoLimite = new Date().getFullYear() + 1

const isbnSchema = z
  .string()
  .trim()
  .transform((isbn) => isbn.replace(/[ -]/g, ''))
  .refine((isbn) => /^(?:\d{10}|\d{13})$/.test(isbn), {
    message: 'O ISBN deve ter 10 ou 13 digitos',
  })

const idsUnicosSchema = z
  .array(idSchema)
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Nao repita identificadores',
  })

export const criarLivroSchema = z
  .object({
    titulo: textoObrigatorioSchema.max(200),
    sinopse: z.string().trim().max(5000).optional(),
    urlCapa: z.string().url().optional(),
    idioma: z.string().trim().min(2).max(10).default('pt-BR'),
    autorIds: idsUnicosSchema.max(20),
    categoriaIds: idsUnicosSchema.max(20),
  })
  .strict()

export const criarEdicaoSchema = z
  .object({
    livroId: idSchema,
    isbn: isbnSchema.optional(),
    formato: z.enum(['FISICO', 'EBOOK']),
    editora: z.string().trim().min(1).max(160).optional(),
    anoPublicacao: z.number().int().min(1450).max(anoLimite).optional(),
    numeroPaginas: z.number().int().positive().max(100_000).optional(),
  })
  .strict()

const ofertaBaseSchema = z.object({
  edicaoId: idSchema,
  preco: z.number().finite().nonnegative().max(99_999_999.99),
})

const ofertaFisicaSchema = ofertaBaseSchema.extend({
  formato: z.literal('FISICO'),
  estoque: z.number().int().nonnegative(),
  chaveArquivoDigital: z.never().optional(),
})

const ofertaEbookSchema = ofertaBaseSchema.extend({
  formato: z.literal('EBOOK'),
  estoque: z.never().optional(),
  chaveArquivoDigital: textoObrigatorioSchema.max(500),
})

export const criarOfertaSchema = z.discriminatedUnion('formato', [
  ofertaFisicaSchema,
  ofertaEbookSchema,
])


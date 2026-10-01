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

export const criarAutorSchema = z
  .object({
    nome: textoObrigatorioSchema.min(2).max(160),
    biografia: z.string().trim().max(5000).optional(),
  })
  .strict()

export const criarCategoriaSchema = z
  .object({
    nome: textoObrigatorioSchema.min(2).max(100),
    descricao: z.string().trim().max(2000).optional(),
  })
  .strict()

export const criarLivroSchema = z
  .object({
    titulo: textoObrigatorioSchema.max(200),
    sinopse: z.string().trim().max(5000).optional(),
    urlCapa: z.string().url().optional(),
    idioma: z.string().trim().min(2).max(10).default('pt-BR'),
    destaque: z.boolean().default(false),
    enriquecidoPorIa: z.boolean().default(false),
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
  precoAluguel: z.number().finite().positive().max(99_999_999.99).optional(),
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

export const ofertaIdParametroSchema = z
  .object({
    ofertaId: idSchema,
  })
  .strict()

export const registrarVisualizacaoSchema = z
  .object({
    sessaoId: z.string().uuid().optional(),
  })
  .strict()

export const alterarStatusOfertaSchema = z
  .object({
    status: z.enum(['RASCUNHO', 'ATIVA', 'INATIVA']),
  })
  .strict()

export const listarLivrosSchema = z
  .object({
    termo: z.string().trim().min(2).max(200).optional(),
    formato: z.enum(['FISICO', 'EBOOK']).optional(),
    categoriaId: idSchema.optional(),
    destaque: z
      .enum(['true', 'false'])
      .transform((valor) => valor === 'true')
      .optional(),
    ordenacao: z
      .enum(['TITULO', 'MAIS_RECENTES', 'MELHOR_AVALIADOS', 'MENOR_AVALIADOS'])
      .default('TITULO'),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict()

export const livroIdParametroSchema = z
  .object({
    livroId: idSchema,
  })
  .strict()

export const alterarDestaqueLivroSchema = z
  .object({
    destaque: z.boolean(),
  })
  .strict()

export type ListarLivrosEntrada = z.infer<typeof listarLivrosSchema>
export type RegistrarVisualizacaoEntrada = z.infer<
  typeof registrarVisualizacaoSchema
>
export type CriarAutorEntrada = z.infer<typeof criarAutorSchema>
export type CriarCategoriaEntrada = z.infer<typeof criarCategoriaSchema>
export type CriarLivroEntrada = z.infer<typeof criarLivroSchema>
export type CriarEdicaoEntrada = z.infer<typeof criarEdicaoSchema>
export type CriarOfertaEntrada = z.infer<typeof criarOfertaSchema>
export type AlterarStatusOfertaEntrada = z.infer<
  typeof alterarStatusOfertaSchema
>
export type AlterarDestaqueLivroEntrada = z.infer<
  typeof alterarDestaqueLivroSchema
>


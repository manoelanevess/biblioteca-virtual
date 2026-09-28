import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  listarLivrosSchema,
  livroIdParametroSchema,
} from '../schemas/catalogo.js'

describe('consulta do catalogo', () => {
  it('aplica a paginacao padrao', () => {
    const resultado = listarLivrosSchema.parse({})

    assert.deepEqual(resultado, {
      pagina: 1,
      limite: 12,
    })
  })

  it('converte paginacao recebida pela URL', () => {
    const resultado = listarLivrosSchema.parse({
      termo: '  fantasia ',
      formato: 'EBOOK',
      pagina: '2',
      limite: '24',
    })

    assert.deepEqual(resultado, {
      termo: 'fantasia',
      formato: 'EBOOK',
      pagina: 2,
      limite: 24,
    })
  })

  it('rejeita limites acima do permitido', () => {
    const resultado = listarLivrosSchema.safeParse({ limite: '51' })

    assert.equal(resultado.success, false)
  })

  it('valida o identificador usado no detalhe do livro', () => {
    const valido = livroIdParametroSchema.safeParse({
      livroId: '04b26139-fe63-40c1-bb98-0f01ad7a4d22',
    })
    const invalido = livroIdParametroSchema.safeParse({ livroId: '123' })

    assert.equal(valido.success, true)
    assert.equal(invalido.success, false)
  })
})

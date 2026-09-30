import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  solicitarSugestaoLivroSchema,
  sugestaoLivroIaSchema,
} from '../schemas/ia.js'

describe('consulta de livro com IA', () => {
  it('normaliza os dados usados na consulta', () => {
    const entrada = solicitarSugestaoLivroSchema.parse({
      titulo: '  Dom Casmurro  ',
      autor: '  Machado de Assis  ',
      isbn: '978-85-359-0277-5',
    })

    assert.deepEqual(entrada, {
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      isbn: '9788535902775',
    })
  })

  it('rejeita um ISBN invalido', () => {
    const resultado = solicitarSugestaoLivroSchema.safeParse({
      titulo: 'Dom Casmurro',
      isbn: '1234',
    })

    assert.equal(resultado.success, false)
  })

  it('valida a resposta estruturada da IA', () => {
    const resultado = sugestaoLivroIaSchema.safeParse({
      autorSugerido: 'Machado de Assis',
      sinopse:
        'Um retrato de memoria, ciume e ambiguidade narrado por Bento Santiago ao reconstruir sua juventude.',
      categoriaSugerida: 'Literatura brasileira',
      idioma: 'pt-BR',
    })

    assert.equal(resultado.success, true)
  })

  it('rejeita respostas incompletas da IA', () => {
    const resultado = sugestaoLivroIaSchema.safeParse({
      sinopse: 'Texto curto',
      idioma: 'pt-BR',
    })

    assert.equal(resultado.success, false)
  })
})

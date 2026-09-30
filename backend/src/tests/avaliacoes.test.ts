import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  responderAvaliacaoSchema,
  salvarAvaliacaoSchema,
} from '../schemas/avaliacoes.js'

describe('avaliacoes', () => {
  it('aceita nota e comentario validos', () => {
    const resultado = salvarAvaliacaoSchema.parse({
      nota: 5,
      comentario: ' Uma leitura excelente. ',
    })

    assert.deepEqual(resultado, {
      nota: 5,
      comentario: 'Uma leitura excelente.',
    })
  })

  it('converte comentario vazio em nulo', () => {
    const resultado = salvarAvaliacaoSchema.parse({ nota: 4, comentario: '' })

    assert.equal(resultado.comentario, null)
  })

  it('rejeita notas fora do intervalo permitido', () => {
    assert.equal(
      salvarAvaliacaoSchema.safeParse({ nota: 0 }).success,
      false,
    )
    assert.equal(
      salvarAvaliacaoSchema.safeParse({ nota: 6 }).success,
      false,
    )
  })

  it('exige uma resposta com conteudo', () => {
    assert.equal(
      responderAvaliacaoSchema.safeParse({ resposta: '  ' }).success,
      false,
    )
    assert.equal(
      responderAvaliacaoSchema.safeParse({ resposta: 'Obrigado!' }).success,
      true,
    )
  })
})

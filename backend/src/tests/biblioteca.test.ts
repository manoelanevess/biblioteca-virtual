import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  atualizarProgressoSchema,
  itemBibliotecaIdParametroSchema,
} from '../schemas/biblioteca.js'

describe('progresso de leitura', () => {
  it('aceita uma leitura em andamento', () => {
    const resultado = atualizarProgressoSchema.parse({
      statusLeitura: 'LENDO',
      percentualLido: 42,
      paginaAtual: 126,
    })

    assert.deepEqual(resultado, {
      statusLeitura: 'LENDO',
      percentualLido: 42,
      paginaAtual: 126,
    })
  })

  it('exige zero por cento quando a leitura nao foi iniciada', () => {
    const resultado = atualizarProgressoSchema.safeParse({
      statusLeitura: 'NAO_INICIADO',
      percentualLido: 15,
    })

    assert.equal(resultado.success, false)
  })

  it('rejeita pagina atual em uma leitura nao iniciada', () => {
    const resultado = atualizarProgressoSchema.safeParse({
      statusLeitura: 'NAO_INICIADO',
      percentualLido: 0,
      paginaAtual: 12,
    })

    assert.equal(resultado.success, false)
  })

  it('exige cem por cento quando a leitura foi concluida', () => {
    const resultado = atualizarProgressoSchema.safeParse({
      statusLeitura: 'CONCLUIDO',
      percentualLido: 99,
    })

    assert.equal(resultado.success, false)
  })

  it('valida o identificador do item da biblioteca', () => {
    const valido = itemBibliotecaIdParametroSchema.safeParse({
      itemBibliotecaId: '04b26139-fe63-40c1-bb98-0f01ad7a4d22',
    })
    const invalido = itemBibliotecaIdParametroSchema.safeParse({
      itemBibliotecaId: '123',
    })

    assert.equal(valido.success, true)
    assert.equal(invalido.success, false)
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  criarPedidoSchema,
  ofertasPertencemAoVendedor,
} from '../schemas/pedidos.js'

const vendedorId = '04b26139-fe63-40c1-bb98-0f01ad7a4d22'
const primeiraOfertaId = '49ae8cf0-c94c-469d-9fe4-595cf6fe33d1'
const segundaOfertaId = 'e3e1b504-ac33-449b-8cf7-62e5aa5cd469'

describe('criacao de pedidos', () => {
  it('aplica quantidade padrao e normaliza o endereco', () => {
    const resultado = criarPedidoSchema.parse({
      vendedorId,
      itens: [{ ofertaId: primeiraOfertaId }],
      enderecoEntrega: {
        destinatario: '  Maria Silva  ',
        cep: '89010000',
        logradouro: '  Rua das Flores  ',
        numero: '  123  ',
        bairro: '  Centro  ',
        cidade: '  Blumenau  ',
        estado: 'sc',
      },
    })

    assert.equal(resultado.itens[0]!.quantidade, 1)
    assert.deepEqual(resultado.enderecoEntrega, {
      destinatario: 'Maria Silva',
      cep: '89010000',
      logradouro: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Blumenau',
      estado: 'SC',
    })
  })

  it('rejeita a mesma oferta repetida no pedido', () => {
    const resultado = criarPedidoSchema.safeParse({
      vendedorId,
      itens: [
        { ofertaId: primeiraOfertaId },
        { ofertaId: primeiraOfertaId, quantidade: 2 },
      ],
    })

    assert.equal(resultado.success, false)
  })

  it('rejeita endereco com CEP ou estado invalidos', () => {
    const resultado = criarPedidoSchema.safeParse({
      vendedorId,
      itens: [{ ofertaId: primeiraOfertaId }],
      enderecoEntrega: {
        destinatario: 'Maria Silva',
        cep: '89010-000',
        logradouro: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Blumenau',
        estado: 'Santa Catarina',
      },
    })

    assert.equal(resultado.success, false)
  })

  it('confere se todas as ofertas pertencem ao vendedor informado', () => {
    assert.equal(
      ofertasPertencemAoVendedor(vendedorId, [
        { vendedorId },
        { vendedorId },
      ]),
      true,
    )
    assert.equal(
      ofertasPertencemAoVendedor(vendedorId, [
        { vendedorId },
        { vendedorId: segundaOfertaId },
      ]),
      false,
    )
  })
})

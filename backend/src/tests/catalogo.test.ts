import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  alterarDestaqueLivroSchema,
  alterarStatusOfertaSchema,
  criarAutorSchema,
  criarCategoriaSchema,
  criarEdicaoSchema,
  criarLivroSchema,
  criarOfertaSchema,
  listarLivrosSchema,
  livroIdParametroSchema,
  registrarVisualizacaoSchema,
} from '../schemas/catalogo.js'

describe('consulta do catalogo', () => {
  it('aplica a paginacao padrao', () => {
    const resultado = listarLivrosSchema.parse({})

    assert.deepEqual(resultado, {
      ordenacao: 'TITULO',
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
      ordenacao: 'TITULO',
      pagina: 2,
      limite: 24,
    })
  })

  it('rejeita limites acima do permitido', () => {
    const resultado = listarLivrosSchema.safeParse({ limite: '51' })

    assert.equal(resultado.success, false)
  })

  it('converte o filtro de destaque recebido pela URL', () => {
    assert.equal(listarLivrosSchema.parse({ destaque: 'true' }).destaque, true)
    assert.equal(
      listarLivrosSchema.parse({ destaque: 'false' }).destaque,
      false,
    )
  })

  it('aceita as opcoes de ordenacao do catalogo', () => {
    assert.equal(
      listarLivrosSchema.parse({ ordenacao: 'MAIS_RECENTES' }).ordenacao,
      'MAIS_RECENTES',
    )
    assert.equal(
      listarLivrosSchema.safeParse({ ordenacao: 'MAIS_VENDIDOS' }).success,
      false,
    )
  })

  it('valida o identificador usado no detalhe do livro', () => {
    const valido = livroIdParametroSchema.safeParse({
      livroId: '04b26139-fe63-40c1-bb98-0f01ad7a4d22',
    })
    const invalido = livroIdParametroSchema.safeParse({ livroId: '123' })

    assert.equal(valido.success, true)
    assert.equal(invalido.success, false)
  })

  it('aceita uma sessao valida ao registrar visualizacao', () => {
    const resultado = registrarVisualizacaoSchema.safeParse({
      sessaoId: '04b26139-fe63-40c1-bb98-0f01ad7a4d22',
    })

    assert.equal(resultado.success, true)
  })
})

describe('cadastro do catalogo', () => {
  const livroId = '04b26139-fe63-40c1-bb98-0f01ad7a4d22'
  const autorId = '49ae8cf0-c94c-469d-9fe4-595cf6fe33d1'
  const categoriaId = 'e3e1b504-ac33-449b-8cf7-62e5aa5cd469'

  it('normaliza autor e categoria', () => {
    const autor = criarAutorSchema.parse({ nome: '  Machado de Assis  ' })
    const categoria = criarCategoriaSchema.parse({
      nome: '  Romance  ',
      descricao: '  Ficcao em prosa  ',
    })

    assert.deepEqual(autor, { nome: 'Machado de Assis' })
    assert.deepEqual(categoria, {
      nome: 'Romance',
      descricao: 'Ficcao em prosa',
    })
  })

  it('rejeita autores repetidos no mesmo livro', () => {
    const resultado = criarLivroSchema.safeParse({
      titulo: 'Dom Casmurro',
      autorIds: [autorId, autorId],
      categoriaIds: [categoriaId],
    })

    assert.equal(resultado.success, false)
  })

  it('normaliza o ISBN de uma edicao', () => {
    const edicao = criarEdicaoSchema.parse({
      livroId,
      isbn: '978-85-359-0277-5',
      formato: 'FISICO',
    })

    assert.equal(edicao.isbn, '9788535902775')
  })

  it('exige estoque apenas para livro fisico', () => {
    const fisicoSemEstoque = criarOfertaSchema.safeParse({
      edicaoId: livroId,
      formato: 'FISICO',
      preco: 49.9,
    })
    const ebook = criarOfertaSchema.safeParse({
      edicaoId: livroId,
      formato: 'EBOOK',
      preco: 29.9,
      chaveArquivoDigital: 'ebooks/dom-casmurro.epub',
    })

    assert.equal(fisicoSemEstoque.success, false)
    assert.equal(ebook.success, true)
  })

  it('aceita um preco opcional para aluguel', () => {
    const oferta = criarOfertaSchema.parse({
      edicaoId: livroId,
      formato: 'FISICO',
      preco: 49.9,
      precoAluguel: 14.9,
      estoque: 3,
    })

    assert.equal(oferta.precoAluguel, 14.9)
  })

  it('rejeita aluguel com preco zerado', () => {
    const oferta = criarOfertaSchema.safeParse({
      edicaoId: livroId,
      formato: 'EBOOK',
      preco: 29.9,
      precoAluguel: 0,
      chaveArquivoDigital: 'ebooks/dom-casmurro.epub',
    })

    assert.equal(oferta.success, false)
  })

  it('aceita apenas os status previstos para uma oferta', () => {
    assert.equal(
      alterarStatusOfertaSchema.safeParse({ status: 'ATIVA' }).success,
      true,
    )
    assert.equal(
      alterarStatusOfertaSchema.safeParse({ status: 'PUBLICADA' }).success,
      false,
    )
  })

  it('aceita apenas valores booleanos para o destaque', () => {
    assert.equal(
      alterarDestaqueLivroSchema.safeParse({ destaque: true }).success,
      true,
    )
    assert.equal(
      alterarDestaqueLivroSchema.safeParse({ destaque: 'true' }).success,
      false,
    )
  })
})

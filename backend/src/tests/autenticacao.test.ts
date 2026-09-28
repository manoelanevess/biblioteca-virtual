import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { criarHashSenha, verificarSenha } from '../auth/senha.js'
import { PerfilUsuario } from '../generated/prisma/enums.js'
import {
  entrarSchema,
  registrarUsuarioSchema,
} from '../schemas/autenticacao.js'

process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5433/biblioteca_virtual?schema=public'
process.env.JWT_SECRET ??= 'test-secret-with-at-least-thirty-two-characters'
process.env.JWT_EXPIRES_IN_SECONDS ??= '7200'

const { gerarTokenAutenticacao, verificarTokenAutenticacao } = await import(
  '../auth/token.js'
)

describe('schemas de autenticacao', () => {
  it('normaliza os dados de cadastro', () => {
    const resultado = registrarUsuarioSchema.parse({
      nome: '  Maria Silva  ',
      email: '  MARIA@EXAMPLE.COM  ',
      senha: 'leitura123',
    })

    assert.equal(resultado.nome, 'Maria Silva')
    assert.equal(resultado.email, 'maria@example.com')
  })

  it('impede a escolha de perfil no cadastro publico', () => {
    const resultado = registrarUsuarioSchema.safeParse({
      nome: 'Maria Silva',
      email: 'maria@example.com',
      senha: 'leitura123',
      perfil: PerfilUsuario.ADMINISTRADOR,
    })

    assert.equal(resultado.success, false)
  })

  it('rejeita senha sem numero', () => {
    const resultado = registrarUsuarioSchema.safeParse({
      nome: 'Maria Silva',
      email: 'maria@example.com',
      senha: 'somenteletras',
    })

    assert.equal(resultado.success, false)
  })

  it('normaliza o email usado no login', () => {
    const resultado = entrarSchema.parse({
      email: '  MARIA@EXAMPLE.COM ',
      senha: 'leitura123',
    })

    assert.equal(resultado.email, 'maria@example.com')
  })
})

describe('senha', () => {
  it('gera e verifica um hash sem armazenar o texto original', async () => {
    const senha = 'leitura123'
    const senhaHash = await criarHashSenha(senha)

    assert.notEqual(senhaHash, senha)
    assert.equal(await verificarSenha(senha, senhaHash), true)
    assert.equal(await verificarSenha('senha-incorreta', senhaHash), false)
  })
})

describe('token de autenticacao', () => {
  it('gera e verifica os dados do usuario', async () => {
    const dados = {
      usuarioId: '04b26139-fe63-40c1-bb98-0f01ad7a4d22',
      perfil: PerfilUsuario.CLIENTE,
    }
    const token = await gerarTokenAutenticacao(dados)

    assert.deepEqual(await verificarTokenAutenticacao(token), dados)
  })

  it('rejeita um token adulterado', async () => {
    const token = await gerarTokenAutenticacao({
      usuarioId: '04b26139-fe63-40c1-bb98-0f01ad7a4d22',
      perfil: PerfilUsuario.CLIENTE,
    })
    const partes = token.split('.')
    const assinatura = partes[2]!
    const primeiroCaractere = assinatura[0] === 'a' ? 'b' : 'a'
    const tokenAdulterado = [
      partes[0],
      partes[1],
      `${primeiroCaractere}${assinatura.slice(1)}`,
    ].join('.')

    assert.equal(await verificarTokenAutenticacao(tokenAdulterado), null)
  })
})

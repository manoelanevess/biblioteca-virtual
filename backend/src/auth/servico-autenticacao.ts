import { criarHashSenha, verificarSenha } from './senha.js'
import { gerarTokenAutenticacao } from './token.js'
import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import { PerfilUsuario } from '../generated/prisma/enums.js'
import type {
  EntrarEntrada,
  RegistrarUsuarioEntrada,
} from '../schemas/autenticacao.js'

const selecaoUsuarioPublico = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  criadoEm: true,
} as const

export async function registrarUsuario(entrada: RegistrarUsuarioEntrada) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: entrada.email },
    select: { id: true },
  })

  if (usuarioExistente) {
    throw new ErroHttp(409, 'EMAIL_EM_USO', 'Este email ja esta cadastrado')
  }

  const senhaHash = await criarHashSenha(entrada.senha)
  const usuario = await prisma.usuario.create({
    data: {
      nome: entrada.nome,
      email: entrada.email,
      senhaHash,
      perfil: PerfilUsuario.CLIENTE,
    },
    select: selecaoUsuarioPublico,
  })

  const token = await gerarTokenAutenticacao({
    usuarioId: usuario.id,
    perfil: usuario.perfil,
  })

  return { usuario, token }
}

export async function entrar(entrada: EntrarEntrada) {
  const usuarioComSenha = await prisma.usuario.findUnique({
    where: { email: entrada.email },
    select: {
      ...selecaoUsuarioPublico,
      senhaHash: true,
    },
  })

  if (
    !usuarioComSenha ||
    !(await verificarSenha(entrada.senha, usuarioComSenha.senhaHash))
  ) {
    throw new ErroHttp(401, 'CREDENCIAIS_INVALIDAS', 'Email ou senha invalidos')
  }

  const usuario = {
    id: usuarioComSenha.id,
    nome: usuarioComSenha.nome,
    email: usuarioComSenha.email,
    perfil: usuarioComSenha.perfil,
    criadoEm: usuarioComSenha.criadoEm,
  }
  const token = await gerarTokenAutenticacao({
    usuarioId: usuario.id,
    perfil: usuario.perfil,
  })

  return { usuario, token }
}

export async function obterUsuarioAutenticado(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: selecaoUsuarioPublico,
  })

  if (!usuario) {
    throw new ErroHttp(401, 'USUARIO_INVALIDO', 'Usuario nao encontrado')
  }

  return usuario
}

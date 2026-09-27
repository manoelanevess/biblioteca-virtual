import type { RequestHandler } from 'express'

import { verificarTokenAutenticacao } from '../auth/token.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { PerfilUsuario } from '../generated/prisma/enums.js'

export const exigirAutenticacao: RequestHandler = async (
  request,
  _response,
  next,
) => {
  const [tipo, token] = request.headers.authorization?.split(' ') ?? []

  if (tipo !== 'Bearer' || !token) {
    next(new ErroHttp(401, 'TOKEN_AUSENTE', 'Token de acesso nao informado'))
    return
  }

  const dadosToken = await verificarTokenAutenticacao(token)

  if (!dadosToken) {
    next(new ErroHttp(401, 'TOKEN_INVALIDO', 'Token de acesso invalido'))
    return
  }

  request.usuarioAutenticado = dadosToken
  next()
}

export function exigirPerfis(...perfisPermitidos: PerfilUsuario[]): RequestHandler {
  return (request, _response, next) => {
    const usuario = request.usuarioAutenticado

    if (!usuario) {
      next(new ErroHttp(401, 'NAO_AUTENTICADO', 'Autenticacao necessaria'))
      return
    }

    if (!perfisPermitidos.includes(usuario.perfil)) {
      next(new ErroHttp(403, 'ACESSO_NEGADO', 'Perfil sem permissao de acesso'))
      return
    }

    next()
  }
}

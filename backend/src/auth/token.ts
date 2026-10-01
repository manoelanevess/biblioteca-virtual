import { jwtVerify, SignJWT } from 'jose'

import { env } from '../config/env.js'
import {
  PerfilUsuario,
  type PerfilUsuario as PerfilUsuarioTipo,
} from '../generated/prisma/enums.js'

const algoritmo = 'HS256'
const audiencia = 'biblioteca-virtual'
const emissor = 'biblioteca-virtual-api'
const segredo = new TextEncoder().encode(env.JWT_SECRET)

export type DadosTokenAutenticacao = {
  usuarioId: string
  perfil: PerfilUsuarioTipo
}

export async function gerarTokenAutenticacao({
  usuarioId,
  perfil,
}: DadosTokenAutenticacao) {
  const agora = Math.floor(Date.now() / 1000)

  return new SignJWT({ perfil })
    .setProtectedHeader({ alg: algoritmo, typ: 'JWT' })
    .setSubject(usuarioId)
    .setIssuer(emissor)
    .setAudience(audiencia)
    .setIssuedAt(agora)
    .setExpirationTime(agora + env.JWT_EXPIRES_IN_SECONDS)
    .sign(segredo)
}

export async function verificarTokenAutenticacao(
  token: string,
): Promise<DadosTokenAutenticacao | null> {
  try {
    const { payload } = await jwtVerify(token, segredo, {
      algorithms: [algoritmo],
      audience: audiencia,
      issuer: emissor,
    })

    if (
      !payload.sub ||
      typeof payload.perfil !== 'string' ||
      !Object.values(PerfilUsuario).includes(
        payload.perfil as PerfilUsuarioTipo,
      )
    ) {
      return null
    }

    return {
      usuarioId: payload.sub,
      perfil: payload.perfil as PerfilUsuarioTipo,
    }
  } catch {
    return null
  }
}

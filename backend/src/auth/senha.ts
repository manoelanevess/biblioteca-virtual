import { compare, hash } from 'bcryptjs'

const quantidadeSaltRounds = 12

export function criarHashSenha(senha: string) {
  return hash(senha, quantidadeSaltRounds)
}

export function verificarSenha(senha: string, senhaHash: string) {
  return compare(senha, senhaHash)
}

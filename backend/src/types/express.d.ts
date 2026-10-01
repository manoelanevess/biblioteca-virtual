import type { DadosTokenAutenticacao } from '../auth/token.js'

declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: DadosTokenAutenticacao
    }
  }
}

export {}

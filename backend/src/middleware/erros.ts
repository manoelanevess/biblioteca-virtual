import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

import { ErroHttp } from '../errors/erro-http.js'

export const rotaNaoEncontrada: RequestHandler = (_request, _response, next) => {
  next(new ErroHttp(404, 'ROTA_NAO_ENCONTRADA', 'Rota nao encontrada'))
}

export const tratarErros: ErrorRequestHandler = (
  erro,
  _request,
  response,
  _next,
) => {
  void _next

  if (erro instanceof ZodError) {
    response.status(400).json({
      erro: {
        codigo: 'DADOS_INVALIDOS',
        mensagem: 'Os dados enviados sao invalidos',
        detalhes: erro.flatten(),
      },
    })
    return
  }

  if (erro instanceof ErroHttp) {
    response.status(erro.status).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
      },
    })
    return
  }

  console.error(erro)
  response.status(500).json({
    erro: {
      codigo: 'ERRO_INTERNO',
      mensagem: 'Nao foi possivel concluir a operacao',
    },
  })
}

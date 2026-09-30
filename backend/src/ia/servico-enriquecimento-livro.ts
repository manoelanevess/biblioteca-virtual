import { GoogleGenAI } from '@google/genai'

import { env } from '../config/env.js'
import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import {
  sugestaoLivroIaSchema,
  type SolicitarSugestaoLivroEntrada,
} from '../schemas/ia.js'

const modelo = 'gemini-flash-latest'

export async function sugerirDadosLivro(
  entrada: SolicitarSugestaoLivroEntrada,
) {
  if (!env.GEMINI_API_KEY) {
    throw new ErroHttp(
      503,
      'IA_NAO_CONFIGURADA',
      'A consulta com IA ainda nao foi configurada',
    )
  }

  const categorias = await prisma.categoria.findMany({
    select: { nome: true },
    orderBy: { nome: 'asc' },
  })
  const nomesCategorias = categorias.map(({ nome }) => nome)
  const cliente = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  try {
    const resposta = await cliente.models.generateContent({
      model: modelo,
      contents: JSON.stringify({
        livro: entrada,
        categoriasDisponiveis: nomesCategorias,
      }),
      config: {
        systemInstruction: [
          'Voce auxilia no cadastro de livros de uma biblioteca.',
          'Produza uma sinopse original, objetiva e sem spoilers em portugues.',
          'Nao invente detalhes bibliograficos quando nao tiver certeza.',
          'Retorne o nome pelo qual o autor e normalmente creditado.',
          'Escolha exatamente uma categoria da lista quando houver uma opcao adequada.',
          'Use um nome curto e comum para a categoria quando nenhuma opcao for adequada.',
          'Informe o idioma no formato BCP 47, como pt-BR, en ou es.',
        ].join(' '),
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            autorSugerido: { type: 'string' },
            sinopse: { type: 'string' },
            categoriaSugerida: { type: 'string' },
            idioma: { type: 'string' },
          },
          required: [
            'autorSugerido',
            'sinopse',
            'categoriaSugerida',
            'idioma',
          ],
        },
      },
    })

    if (!resposta.text) {
      throw new Error('Resposta vazia')
    }

    return sugestaoLivroIaSchema.parse(JSON.parse(resposta.text))
  } catch {
    throw new ErroHttp(
      502,
      'CONSULTA_IA_INDISPONIVEL',
      'Nao foi possivel obter sugestoes da IA neste momento',
    )
  }
}

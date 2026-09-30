import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { Prisma } from '../generated/prisma/client.js'
import { PerfilUsuario } from '../generated/prisma/enums.js'
import type {
  ResponderAvaliacaoEntrada,
  SalvarAvaliacaoEntrada,
} from '../schemas/avaliacoes.js'

const selecaoAvaliacao = {
  id: true,
  nota: true,
  comentario: true,
  resposta: true,
  respondidaEm: true,
  criadoEm: true,
  atualizadoEm: true,
  usuario: {
    select: { id: true, nome: true },
  },
  livro: {
    select: { id: true, titulo: true, urlCapa: true },
  },
} satisfies Prisma.AvaliacaoSelect

function criarFiltroGerenciamento(
  usuarioId: string,
  perfil: PerfilUsuario,
): Prisma.AvaliacaoWhereInput {
  if (perfil === PerfilUsuario.ADMINISTRADOR) {
    return {}
  }

  return {
    livro: {
      edicoes: {
        some: {
          ofertas: { some: { vendedorId: usuarioId } },
        },
      },
    },
  }
}

export async function listarAvaliacoesDoLivro(livroId: string) {
  return prisma.avaliacao.findMany({
    where: { livroId },
    select: selecaoAvaliacao,
    orderBy: { atualizadoEm: 'desc' },
  })
}

export async function listarAvaliacoesDoUsuario(usuarioId: string) {
  return prisma.avaliacao.findMany({
    where: { usuarioId },
    select: selecaoAvaliacao,
    orderBy: { atualizadoEm: 'desc' },
  })
}

export async function salvarAvaliacao(
  usuarioId: string,
  livroId: string,
  entrada: SalvarAvaliacaoEntrada,
) {
  const livro = await prisma.livro.findUnique({
    where: { id: livroId },
    select: { id: true },
  })

  if (!livro) {
    throw new ErroHttp(404, 'LIVRO_NAO_ENCONTRADO', 'Livro nao encontrado')
  }

  return prisma.avaliacao.upsert({
    where: { usuarioId_livroId: { usuarioId, livroId } },
    update: {
      nota: entrada.nota,
      comentario: entrada.comentario,
      resposta: null,
      respondidaEm: null,
    },
    create: {
      usuarioId,
      livroId,
      nota: entrada.nota,
      comentario: entrada.comentario,
    },
    select: selecaoAvaliacao,
  })
}

export async function listarAvaliacoesGerenciadas(
  usuarioId: string,
  perfil: PerfilUsuario,
) {
  return prisma.avaliacao.findMany({
    where: criarFiltroGerenciamento(usuarioId, perfil),
    select: selecaoAvaliacao,
    orderBy: { atualizadoEm: 'desc' },
  })
}

export async function responderAvaliacao(
  usuarioId: string,
  perfil: PerfilUsuario,
  avaliacaoId: string,
  entrada: ResponderAvaliacaoEntrada,
) {
  await obterAvaliacaoGerenciavel(usuarioId, perfil, avaliacaoId)

  return prisma.avaliacao.update({
    where: { id: avaliacaoId },
    data: {
      resposta: entrada.resposta,
      respondidaEm: new Date(),
    },
    select: selecaoAvaliacao,
  })
}

export async function excluirAvaliacao(
  usuarioId: string,
  perfil: PerfilUsuario,
  avaliacaoId: string,
) {
  await obterAvaliacaoGerenciavel(usuarioId, perfil, avaliacaoId)
  await prisma.avaliacao.delete({ where: { id: avaliacaoId } })
}

async function obterAvaliacaoGerenciavel(
  usuarioId: string,
  perfil: PerfilUsuario,
  avaliacaoId: string,
) {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: {
      id: avaliacaoId,
      ...criarFiltroGerenciamento(usuarioId, perfil),
    },
    select: { id: true },
  })

  if (!avaliacao) {
    throw new ErroHttp(
      404,
      'AVALIACAO_NAO_ENCONTRADA',
      'Avaliacao nao encontrada',
    )
  }
}

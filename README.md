# Biblioteca Virtual Inteligente

> Nome do projeto ainda em definicao.

## Sobre o projeto

Este projeto sera uma biblioteca virtual com compra de livros fisicos e e-books.

A ideia principal e que o usuario nao apenas compre livros, mas tambem tenha uma area pessoal para acompanhar sua leitura. Depois de comprar um livro, ele podera marcar a porcentagem lida, alterar o status da leitura, favoritar, avaliar e comentar.

O sistema tambem tera uma area de venda para cadastrar ofertas, controlar estoque e acompanhar o desempenho dos livros. A area administrativa sera usada para gerenciar a plataforma.

## Proposta atual

O projeto combina tres partes principais:

- **Compra de livros**: usuarios poderao comprar livros fisicos ou digitais.
- **Biblioteca pessoal**: cada usuario tera uma area com seus livros comprados e progresso de leitura.
- **Inteligencia Artificial**: a IA ajudara na busca de livros, recomendacoes e cadastro inteligente.

Assim, o projeto nao sera apenas uma loja virtual nem apenas um cadastro de livros. A proposta e criar uma plataforma onde a compra, a leitura e a recomendacao funcionem juntas.

## Funcionalidades planejadas

### Usuario

- Criar conta e fazer login.
- Visualizar o catalogo de livros.
- Buscar livros por titulo, autor, categoria, formato ou IA.
- Comprar livros fisicos ou e-books.
- Acessar a propria biblioteca pessoal.
- Marcar status de leitura.
- Informar porcentagem lida.
- Favoritar livros.
- Avaliar livros com nota e comentario.
- Receber recomendacoes.

### Vendedor

- Fazer login.
- Cadastrar e editar ofertas de livros.
- Definir formato, preco e estoque.
- Acompanhar vendas e visualizacoes.
- Consultar o proprio dashboard.
- Usar IA para auxiliar no cadastro dos livros.

### Administrador

- Gerenciar usuarios e vendedores.
- Gerenciar livros e categorias.
- Moderar avaliacoes e informacoes do catalogo.
- Consultar indicadores gerais da plataforma.

## Livros fisicos e e-books

O sistema devera diferenciar livros fisicos e e-books.

Para livros fisicos, sera necessario controlar estoque e disponibilidade.

Para e-books, o acesso podera ser liberado apos a compra, sem necessidade de estoque fisico.

Um mesmo livro podera ter os dois formatos disponiveis.

## Uso da IA

A IA sera usada de forma pratica em pontos especificos do sistema.

### Busca inteligente

O usuario podera escrever buscas em linguagem natural, como:

> Quero um e-book barato de fantasia para iniciantes.

O sistema devera interpretar a busca e encontrar livros compativeis.

### Cadastro inteligente

O administrador podera informar dados basicos de um livro, como titulo, autor, editora e ano.

A IA podera sugerir informacoes complementares, como sinopse, categoria, tags, publico recomendado e nivel de leitura.

### Recomendacoes

O sistema podera recomendar livros com base em compras, favoritos, avaliacoes e progresso de leitura do usuario.

## Dashboard

Vendedores e administradores terao dashboards de acordo com suas responsabilidades.

Indicadores iniciais:

- Total de vendas.
- Faturamento.
- Livros mais vendidos.
- Livros mais bem avaliados.
- Vendas de livros fisicos vs e-books.
- Categorias mais procuradas.
- Estoque baixo.
- Visualizacoes das ofertas.
- Uso da busca com IA.

## MVP inicial

Para a primeira versao, o foco sera entregar o essencial:

- Login de usuario, vendedor e administrador.
- Cadastro de livros e categorias.
- Cadastro dos formatos fisico e e-book.
- Catalogo de livros.
- Compra simples.
- Biblioteca pessoal do usuario.
- Progresso de leitura.
- Avaliacao de livros.
- Busca com IA.
- Dashboard basico.

## Executando o projeto

Requisitos: Node.js 22.18 ou superior, pnpm 11.19 e Docker.

```powershell
pnpm install
Copy-Item backend/.env.example backend/.env
pnpm db:up
pnpm db:migrate
pnpm db:generate
```

Para iniciar cada parte do sistema:

```powershell
pnpm dev:backend
pnpm dev:frontend
```

## Observacoes

Esta documentacao ainda e inicial. As ideias podem ser ajustadas conforme o projeto evoluir, novas necessidades aparecerem e o modelo do banco de dados for refinado.

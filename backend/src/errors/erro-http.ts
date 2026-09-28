export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroHttp'
  }
}

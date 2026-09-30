const sessionStorageKey = 'biblioteca-virtual-session'

export type UserRole = 'CLIENTE' | 'VENDEDOR' | 'ADMINISTRADOR'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export type Session = {
  user: User
  token: string
}

type ApiUser = {
  id: string
  nome: string
  email: string
  perfil: UserRole
  criadoEm: string
}

type AuthenticationResponse = {
  usuario: ApiUser
  token: string
}

type ApiErrorResponse = {
  erro?: {
    codigo?: string
    mensagem?: string
  }
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(
    message: string,
    code: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export async function login(input: { email: string; password: string }) {
  const response = await request<AuthenticationResponse>(
    '/api/autenticacao/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        senha: input.password,
      }),
    },
  )

  return mapSession(response)
}

export async function register(input: {
  name: string
  email: string
  password: string
  role?: 'CLIENTE' | 'VENDEDOR'
}) {
  const response = await request<AuthenticationResponse>(
    '/api/autenticacao/registro',
    {
      method: 'POST',
      body: JSON.stringify({
        nome: input.name,
        email: input.email,
        senha: input.password,
      }),
    },
  )

  const session = mapSession(response)

  return input.role === 'VENDEDOR'
    ? enableSellerProfile(session.token)
    : session
}

export async function getCurrentUser(token: string) {
  const response = await request<{ usuario: ApiUser }>(
    '/api/autenticacao/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  return mapUser(response.usuario)
}

export async function enableSellerProfile(token: string) {
  const response = await request<AuthenticationResponse>(
    '/api/autenticacao/perfil-vendedor',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  return mapSession(response)
}

export function getStoredSession(): Session | null {
  try {
    const storedValue = localStorage.getItem(sessionStorageKey)

    if (!storedValue) {
      return null
    }

    const session = JSON.parse(storedValue) as Partial<Session>

    if (
      typeof session.token !== 'string' ||
      !session.user ||
      typeof session.user.id !== 'string' ||
      typeof session.user.email !== 'string'
    ) {
      clearSession()
      return null
    }

    return session as Session
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(sessionStorageKey, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(sessionStorageKey)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor.',
      'CONEXAO_INDISPONIVEL',
      0,
    )
  }

  const body = (await response.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null

  if (!response.ok) {
    const apiError = body as ApiErrorResponse | null
    throw new ApiError(
      apiError?.erro?.mensagem ?? 'Não foi possível concluir a operação.',
      apiError?.erro?.codigo ?? 'ERRO_DESCONHECIDO',
      response.status,
    )
  }

  return body as T
}

function mapSession(response: AuthenticationResponse): Session {
  return {
    user: mapUser(response.usuario),
    token: response.token,
  }
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    role: user.perfil,
    createdAt: user.criadoEm,
  }
}

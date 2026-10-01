import { apiUrl } from './base'

const sessionStorageKey = 'biblioteca-virtual-session'
const clientIdStorageKey = 'biblioteca-virtual-client-id'
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
    const persistentValue = localStorage.getItem(sessionStorageKey)
    const storedValue =
      persistentValue ?? sessionStorage.getItem(sessionStorageKey)

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

    const validSession = session as Session
    syncClientId(validSession, persistentValue !== null)
    return validSession
  } catch {
    clearSession()
    return null
  }
}

export function hasPersistentSession() {
  return localStorage.getItem(sessionStorageKey) !== null
}

export function getStoredClientId(): string | null {
  const clientId = localStorage.getItem(clientIdStorageKey)

  if (!clientId) {
    return null
  }

  if (!uuidPattern.test(clientId)) {
    localStorage.removeItem(clientIdStorageKey)
    return null
  }

  return clientId
}

export function saveSession(session: Session, keepConnected = false) {
  const serializedSession = JSON.stringify(session)

  localStorage.removeItem(sessionStorageKey)
  sessionStorage.removeItem(sessionStorageKey)

  if (keepConnected) {
    localStorage.setItem(sessionStorageKey, serializedSession)
  } else {
    sessionStorage.setItem(sessionStorageKey, serializedSession)
  }

  syncClientId(session, keepConnected)
}

export function clearSession() {
  localStorage.removeItem(sessionStorageKey)
  sessionStorage.removeItem(sessionStorageKey)
  localStorage.removeItem(clientIdStorageKey)
}

function syncClientId(session: Session, keepConnected: boolean) {
  if (
    keepConnected &&
    session.user.role === 'CLIENTE' &&
    uuidPattern.test(session.user.id)
  ) {
    const storedClientId = getStoredClientId()

    if (storedClientId !== session.user.id) {
      localStorage.setItem(clientIdStorageKey, session.user.id)
    }
    return
  }

  localStorage.removeItem(clientIdStorageKey)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(apiUrl(path), {
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

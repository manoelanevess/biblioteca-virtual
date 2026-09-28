import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  User,
} from 'lucide-react'
import {
  ApiError,
  clearSession,
  getCurrentUser,
  getStoredSession,
  login,
  register,
  saveSession,
  type Session,
} from './api/autenticacao'
import { CatalogManager } from './CatalogManager'
import './App.css'

type AuthMode = 'login' | 'register'

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [initialSession] = useState(getStoredSession)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [restoringSession, setRestoringSession] = useState(
    initialSession !== null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLogin = mode === 'login'

  useEffect(() => {
    if (!initialSession) {
      return
    }

    getCurrentUser(initialSession.token)
      .then((user) => {
        const restoredSession = { ...initialSession, user }
        saveSession(restoredSession)
        setSession(restoredSession)
      })
      .catch(() => {
        clearSession()
        setSession(null)
      })
      .finally(() => setRestoringSession(false))
  }, [initialSession])

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setShowPassword(false)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const nextSession = isLogin
        ? await login({ email, password })
        : await register({
            name: String(formData.get('name') ?? ''),
            email,
            password,
          })

      saveSession(nextSession)
      setSession(nextSession)
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'Não foi possível concluir o acesso. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setMode('login')
    setError(null)
  }

  if (restoringSession) {
    return <SessionLoading />
  }

  if (session) {
    return <AuthenticatedArea session={session} onLogout={handleLogout} />
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Biblioteca virtual">
        <Brand />

        <div className="showcase-copy">
          <p className="section-label">Sua próxima leitura</p>
          <h1>Histórias para levar e continuar.</h1>
          <p>
            Livros físicos e digitais reunidos com a sua jornada de leitura.
          </p>
        </div>

        <div className="reading-preview" aria-label="Leitura em andamento">
          <div className="book-stack" aria-hidden="true">
            <span className="book-cover book-cover-coral">CONTOS</span>
            <span className="book-cover book-cover-yellow">IDEIAS</span>
            <span className="book-cover book-cover-mint">MUNDOS</span>
          </div>

          <div className="reading-status">
            <div>
              <span>Leitura em andamento</span>
              <strong>O tempo entre nós</strong>
            </div>
            <span className="reading-percentage">64%</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span />
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand">
          <Brand />
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? 'active' : undefined}
              onClick={() => changeMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={!isLogin ? 'active' : undefined}
              onClick={() => changeMode('register')}
            >
              Criar conta
            </button>
          </div>

          <header className="auth-heading">
            <p className="section-label">
              {isLogin ? 'Acesse sua conta' : 'Primeiros passos'}
            </p>
            <h2>{isLogin ? 'Boas-vindas de volta' : 'Crie sua biblioteca'}</h2>
            <p>
              {isLogin
                ? 'Entre para continuar de onde você parou.'
                : 'Organize suas leituras desde o primeiro livro.'}
            </p>
          </header>

          <form
            className="auth-form"
            key={mode}
            onSubmit={handleSubmit}
            aria-busy={submitting}
          >
            {!isLogin && (
              <label className="field-group">
                <span>Nome</span>
                <span className="field-control">
                  <User size={18} aria-hidden="true" />
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    minLength={2}
                    maxLength={120}
                    disabled={submitting}
                    required
                  />
                </span>
              </label>
            )}

            <label className="field-group">
              <span>E-mail</span>
              <span className="field-control">
                <Mail size={18} aria-hidden="true" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  maxLength={254}
                  disabled={submitting}
                  required
                />
              </span>
            </label>

            <label className="field-group">
              <span>Senha</span>
              <span className="field-control">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isLogin ? 'Sua senha' : 'Mínimo de 8 caracteres'}
                  minLength={isLogin ? 1 : 8}
                  maxLength={72}
                  disabled={submitting}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>

            {!isLogin && (
              <p className="password-requirement">
                Use pelo menos uma letra e um número.
              </p>
            )}

            {error && (
              <p className="auth-alert" role="alert">
                {error}
              </p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle
                  className="button-loader"
                  size={19}
                  aria-hidden="true"
                />
              ) : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Criar minha conta'}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            <button
              type="button"
              onClick={() => changeMode(isLogin ? 'register' : 'login')}
              disabled={submitting}
            >
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

function Brand() {
  return (
    <div className="brand-lockup">
      <span className="brand-icon" aria-hidden="true">
        <BookOpen size={22} strokeWidth={2} />
      </span>
      <span>Biblioteca virtual</span>
    </div>
  )
}

function SessionLoading() {
  return (
    <main className="session-loading" aria-label="Carregando sessão">
      <Brand />
      <LoaderCircle className="session-loader" size={24} aria-hidden="true" />
    </main>
  )
}

type AuthenticatedAreaProps = {
  session: Session
  onLogout: () => void
}

function AuthenticatedArea({ session, onLogout }: AuthenticatedAreaProps) {
  const firstName = session.user.name.trim().split(/\s+/)[0]
  const initials = session.user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const canManageCatalog = session.user.role !== 'CLIENTE'

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <Brand />
        <div className="user-menu">
          <span className="user-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="user-summary">
            <strong>{session.user.name}</strong>
            <small>{formatRole(session.user.role)}</small>
          </span>
          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <LogOut size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      {canManageCatalog ? (
        <CatalogManager token={session.token} />
      ) : (
        <section className="workspace-content">
          <header className="workspace-heading">
            <p className="section-label">Minha biblioteca</p>
            <h1>Olá, {firstName}.</h1>
            <p>Seus livros e seu progresso ficarão reunidos aqui.</p>
          </header>

          <div className="empty-library">
            <span className="empty-library-icon" aria-hidden="true">
              <BookMarked size={28} />
            </span>
            <h2>Sua estante está vazia</h2>
            <p>Os livros adquiridos aparecerão nesta área.</p>
          </div>
        </section>
      )}
    </main>
  )
}

function formatRole(role: Session['user']['role']) {
  const roleLabels = {
    CLIENTE: 'Cliente',
    VENDEDOR: 'Vendedor',
    ADMINISTRADOR: 'Administrador',
  }

  return roleLabels[role]
}

export default App

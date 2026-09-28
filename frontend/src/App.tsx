import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from 'lucide-react'
import './App.css'

type AuthMode = 'login' | 'register'

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)

  const isLogin = mode === 'login'

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setShowPassword(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Biblioteca virtual">
        <div className="brand-lockup">
          <span className="brand-icon" aria-hidden="true">
            <BookOpen size={22} strokeWidth={2} />
          </span>
          <span>Biblioteca virtual</span>
        </div>

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
          <span className="brand-icon" aria-hidden="true">
            <BookOpen size={20} strokeWidth={2} />
          </span>
          <span>Biblioteca virtual</span>
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

          <form className="auth-form" onSubmit={handleSubmit}>
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
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((visible) => !visible)}
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

            <button className="submit-button" type="submit">
              <span>{isLogin ? 'Entrar' : 'Criar minha conta'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            <button
              type="button"
              onClick={() => changeMode(isLogin ? 'register' : 'login')}
            >
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App

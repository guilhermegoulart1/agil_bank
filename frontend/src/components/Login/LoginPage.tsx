import { useState, useEffect, type FormEvent } from 'react';
import { login } from '../../api/authApi.js';
import './LoginPage.css';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState('');

  // Countdown do lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutCountdown('');
        setError(null);
        setRemainingAttempts(null);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setLockoutCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading || lockoutUntil) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(username, password);

      if (result.success && result.token) {
        onLoginSuccess(result.token);
      } else {
        setError(result.message || 'Erro ao fazer login.');
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        if (result.retryAfterMs) {
          setLockoutUntil(Date.now() + result.retryAfterMs);
        }
      }
    } catch {
      setError('Erro de conexao. Verifique se o servidor esta rodando.');
    } finally {
      setIsLoading(false);
    }
  }

  const isLocked = lockoutUntil !== null;

  return (
    <div className="login-page">
      {/* Painel esquerdo - Imagem */}
      <div className="login-image-panel">
        <div className="login-image-content">
          <div className="login-brand-logo">BA</div>
          <h1 className="login-brand-title">Banco Agil</h1>
          <p className="login-brand-subtitle">
            Plataforma de Atendimento Inteligente
          </p>
          <div className="login-brand-features">
            <div className="login-feature">Agentes de IA especializados</div>
            <div className="login-feature">Analise de credito automatizada</div>
            <div className="login-feature">Consulta de cambio em tempo real</div>
          </div>
        </div>
      </div>

      {/* Painel direito - Formulario */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-logo">BA</div>
          <h2 className="login-form-title">Bem-vindo</h2>
          <p className="login-form-subtitle">
            Acesse o painel de atendimento IA
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="username" className="login-label">Usuario</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuario"
                className="login-input"
                disabled={isLoading || isLocked}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">Senha</label>
              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="login-input"
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '◉' : '○'}
                </button>
              </div>
            </div>

            {error && (
              <div className={`login-error ${isLocked ? 'login-error-locked' : ''}`}>
                <span className="login-error-icon">{isLocked ? '⏳' : '!'}</span>
                <div>
                  <div>{error}</div>
                  {isLocked && lockoutCountdown && (
                    <div className="login-countdown">
                      Tente novamente em {lockoutCountdown}
                    </div>
                  )}
                  {!isLocked && remainingAttempts !== null && remainingAttempts > 0 && (
                    <div className="login-attempts">
                      {remainingAttempts} tentativa{remainingAttempts !== 1 ? 's' : ''} restante{remainingAttempts !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={isLoading || isLocked || !username || !password}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

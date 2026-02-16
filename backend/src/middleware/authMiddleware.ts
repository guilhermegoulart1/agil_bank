import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Credenciais validas
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'agil_tech2026';

// Rate limiting
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const validTokens = new Set<string>();

// Cleanup periodico do rate limiter (a cada 10 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.firstAttemptAt > WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || '0.0.0.0';
}

export function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  const ip = getClientIp(req);

  // Verificar rate limit
  let entry = rateLimitMap.get(ip);
  if (entry) {
    // Resetar se janela expirou
    if (Date.now() - entry.firstAttemptAt > WINDOW_MS) {
      rateLimitMap.delete(ip);
      entry = undefined;
    } else if (entry.attempts >= MAX_ATTEMPTS) {
      const retryAfterMs = WINDOW_MS - (Date.now() - entry.firstAttemptAt);
      res.status(429).json({
        success: false,
        message: 'Muitas tentativas. Tente novamente mais tarde.',
        remainingAttempts: 0,
        retryAfterMs,
      });
      return;
    }
  }

  // Validar credenciais
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    const token = crypto.randomUUID();
    validTokens.add(token);

    // Resetar rate limit no sucesso
    rateLimitMap.delete(ip);

    res.json({ success: true, token });
    return;
  }

  // Credenciais invalidas - incrementar tentativas
  if (!entry) {
    entry = { attempts: 0, firstAttemptAt: Date.now() };
    rateLimitMap.set(ip, entry);
  }
  entry.attempts++;

  const remainingAttempts = MAX_ATTEMPTS - entry.attempts;

  res.status(401).json({
    success: false,
    message: 'Credenciais invalidas.',
    remainingAttempts,
  });
}

export function handleLogout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    validTokens.delete(token);
  }
  res.json({ success: true });
}

export function handleValidateToken(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    res.json({ valid: validTokens.has(token) });
    return;
  }
  res.json({ valid: false });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticacao ausente.' });
    return;
  }

  const token = authHeader.slice(7);
  if (!validTokens.has(token)) {
    res.status(401).json({ error: 'Token invalido ou expirado.' });
    return;
  }

  next();
}

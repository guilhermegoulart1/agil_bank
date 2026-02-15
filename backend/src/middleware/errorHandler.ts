import { Request, Response, NextFunction } from 'express';

// Middleware global de tratamento de erros
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Erro]', err.message, err.stack);

  // Erro de limite de turnos do SDK atingido
  if (err.message.includes('MaxTurns')) {
    res.status(200).json({
      messages: [
        'Desculpe, ocorreu um problema ao processar sua solicitação. Por favor, tente novamente.',
      ],
    });
    return;
  }

  res.status(500).json({
    messages: [
      'Ocorreu um erro interno. Por favor, tente novamente mais tarde.',
    ],
  });
}

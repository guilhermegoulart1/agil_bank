import { Router } from 'express';
import { handleLogin, handleLogout, handleValidateToken } from '../middleware/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/auth/login', handleLogin);
authRouter.post('/auth/logout', handleLogout);
authRouter.get('/auth/validate', handleValidateToken);

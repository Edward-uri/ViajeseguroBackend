import { Router } from 'express';
import * as c from '../controllers/authController.js';

export const authRoutes: Router = Router();

authRoutes.post('/register/start', c.registerStart);
authRoutes.post('/register/verify', c.registerVerify);
authRoutes.post('/register/complete', c.registerComplete);
authRoutes.post('/login/start', c.loginStart);
authRoutes.post('/login/verify', c.loginVerify);
authRoutes.post('/refresh', c.refresh);
authRoutes.post('/logout', c.logoutController);

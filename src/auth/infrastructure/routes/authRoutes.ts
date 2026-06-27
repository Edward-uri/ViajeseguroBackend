import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { aceptarInvitacionController } from '../controllers/invitacionesController.js';
import { authMiddleware } from '../../../middleware/authMiddleware.js';
import { otpSendBurst, otpSendHourly, otpVerify, passwordLogin } from '../rateLimiters.js';

export const authRoutes: Router = Router();

authRoutes.post('/register/start', otpSendBurst, otpSendHourly, c.registerStart);
authRoutes.post('/register/verify', otpVerify, c.registerVerify);
authRoutes.post('/register/complete', c.registerComplete);
authRoutes.post('/login/start', otpSendBurst, otpSendHourly, c.loginStart);
authRoutes.post('/login/verify', otpVerify, c.loginVerify);
authRoutes.post('/refresh', c.refresh);
authRoutes.post('/logout', c.logoutController);
authRoutes.post('/password', authMiddleware, c.setPasswordController);
authRoutes.post('/login/password', passwordLogin, c.loginPassword);
authRoutes.post('/invitaciones/aceptar', aceptarInvitacionController);

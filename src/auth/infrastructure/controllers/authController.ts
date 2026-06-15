import type { RequestHandler } from 'express';
import { authUseCases } from '../dependencies.js';
import * as S from '../schemas.js';

export const registerStart: RequestHandler = async (req, res, next) => {
  try {
    await authUseCases.startRegistration(S.RegisterStartSchema.parse(req.body));
    res.status(202).json({ message: 'Código enviado' });
  } catch (e) { next(e); }
};

export const registerVerify: RequestHandler = async (req, res, next) => {
  try {
    res.json(await authUseCases.verifyRegistration(S.RegisterVerifySchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const registerComplete: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(await authUseCases.completeRegistration(S.RegisterCompleteSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const loginStart: RequestHandler = async (req, res, next) => {
  try {
    await authUseCases.startLogin(S.LoginStartSchema.parse(req.body));
    res.status(202).json({ message: 'Código enviado' });
  } catch (e) { next(e); }
};

export const loginVerify: RequestHandler = async (req, res, next) => {
  try {
    res.json(await authUseCases.verifyLogin(S.LoginVerifySchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    res.json(await authUseCases.refreshSession(S.RefreshSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const logoutController: RequestHandler = async (req, res, next) => {
  try {
    await authUseCases.logout(S.LogoutSchema.parse(req.body));
    res.json({ message: 'Sesión cerrada' });
  } catch (e) { next(e); }
};

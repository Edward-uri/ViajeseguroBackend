import { UserPostgresRepository } from '../../users/infrastructure/UserPostgresRepository.js';
import { OtpPostgresRepository } from './OtpPostgresRepository.js';
import { SessionPostgresRepository } from './SessionPostgresRepository.js';
import { MockOtpSender } from './MockOtpSender.js';
import { startRegistration } from '../application/startRegistration.js';
import { verifyRegistration } from '../application/verifyRegistration.js';
import { completeRegistration } from '../application/completeRegistration.js';
import { startLogin } from '../application/startLogin.js';
import { verifyLogin } from '../application/verifyLogin.js';
import { refreshSession } from '../application/refreshSession.js';
import { logout } from '../application/logout.js';

const users = new UserPostgresRepository();
const otp = new OtpPostgresRepository();
const sessions = new SessionPostgresRepository();
// TODO prod: usar SnsOtpSender cuando NODE_ENV === 'production'
const sender = new MockOtpSender();

export const authUseCases = {
  startRegistration: startRegistration({ users, otp, sender }),
  verifyRegistration: verifyRegistration({ otp }),
  completeRegistration: completeRegistration({ users, sessions }),
  startLogin: startLogin({ users, otp, sender }),
  verifyLogin: verifyLogin({ users, otp, sessions }),
  refreshSession: refreshSession({ users, sessions }),
  logout: logout({ sessions }),
};

import { RegisterUseCase } from './register.use-case';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { ResendOtpUseCase } from './resend-otp.use-case';
import { LoginUseCase } from './login.use-case';
import { LogoutUseCase } from './logout.use-case';
import { GoogleAuthUseCase } from './google-auth.use-case';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';

export * from './otp.service';
export * from './register.use-case';
export * from './verify-email.use-case';
export * from './resend-otp.use-case';
export * from './login.use-case';
export * from './logout.use-case';
export * from './google-auth.use-case';
export * from './forgot-password.use-case';
export * from './reset-password.use-case';

export const AUTH_USE_CASES = [
  RegisterUseCase,
  VerifyEmailUseCase,
  ResendOtpUseCase,
  LoginUseCase,
  LogoutUseCase,
  GoogleAuthUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
];

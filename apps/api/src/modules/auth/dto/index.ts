import { createZodDto } from 'nestjs-zod';
import {
  changePasswordSchema,
  disable2faSchema,
  enable2faVerifySchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@qrgen/shared';

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
export class Enable2faVerifyDto extends createZodDto(enable2faVerifySchema) {}
export class Disable2faDto extends createZodDto(disable2faSchema) {}

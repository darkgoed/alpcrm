import { BadRequestException } from '@nestjs/common';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // limite do bcrypt

export interface PasswordPolicyViolation {
  code: string;
  message: string;
}

export function checkPasswordPolicy(password: string): PasswordPolicyViolation[] {
  const violations: PasswordPolicyViolation[] = [];

  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    violations.push({
      code: 'too_short',
      message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    });
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    violations.push({
      code: 'too_long',
      message: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`,
    });
  }
  if (!/[a-z]/.test(password)) {
    violations.push({
      code: 'no_lowercase',
      message: 'A senha deve conter pelo menos uma letra minúscula',
    });
  }
  if (!/[A-Z]/.test(password)) {
    violations.push({
      code: 'no_uppercase',
      message: 'A senha deve conter pelo menos uma letra maiúscula',
    });
  }
  if (!/[0-9]/.test(password)) {
    violations.push({
      code: 'no_digit',
      message: 'A senha deve conter pelo menos um número',
    });
  }

  return violations;
}

export function assertPasswordPolicy(password: string): void {
  const violations = checkPasswordPolicy(password);
  if (violations.length === 0) return;

  throw new BadRequestException({
    message: violations[0].message,
    errors: violations,
  });
}

// Gera uma senha temporária que satisfaz a política.
export function generateCompliantPassword(length = 12): string {
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lowers + uppers + digits;

  const { randomInt } = require('crypto') as typeof import('crypto');
  const pick = (chars: string) => chars[randomInt(0, chars.length)];

  const required = [pick(lowers), pick(uppers), pick(digits)];
  const rest = Array.from({ length: Math.max(length, PASSWORD_MIN_LENGTH) - required.length }, () =>
    pick(all),
  );
  const raw = [...required, ...rest];

  // Fisher–Yates shuffle
  for (let i = raw.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [raw[i], raw[j]] = [raw[j], raw[i]];
  }

  return raw.join('');
}

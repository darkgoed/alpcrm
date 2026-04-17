import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const ENC_PREFIX = 'enc:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer | null;

  constructor() {
    const raw = process.env.CRYPTO_KEY;
    if (raw) {
      if (raw.length !== 64) {
        throw new Error(
          'CRYPTO_KEY must be a 64-character hex string (32 bytes)',
        );
      }
      this.key = Buffer.from(raw, 'hex');
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'CRYPTO_KEY is required in production for token encryption',
        );
      }
      this.logger.warn(
        'CRYPTO_KEY not set — stored tokens will not be encrypted',
      );
      this.key = null;
    }
  }

  encrypt(plaintext: string): string {
    if (!this.key || !plaintext) return plaintext;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(value: string): string {
    if (!value || !value.startsWith(ENC_PREFIX)) return value;
    if (!this.key) {
      this.logger.warn('Cannot decrypt token: CRYPTO_KEY not set');
      return value;
    }
    const payload = value.slice(ENC_PREFIX.length);
    const parts = payload.split(':');
    if (parts.length !== 3) return value;
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH)
      return value;
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return (
      decipher.update(ciphertext).toString('utf8') + decipher.final('utf8')
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { readJwtSecretRotationConfig } from '../jwt-secret.util';

export interface JwtPayload {
  sub: string;
  email: string;
  workspaceId: string;
  permissions: string[];
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  workspaceId: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const jwtRotation = readJwtSecretRotationConfig(config);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (
        _request: Request,
        rawJwtToken: string,
        done: (error: Error | null, secret?: string) => void,
      ) => {
        try {
          const tokenParts = rawJwtToken.split('.');
          const headerJson = Buffer.from(
            tokenParts[0] ?? '',
            'base64url',
          ).toString('utf8');
          const header = JSON.parse(headerJson) as { kid?: string };
          const headerKid = header.kid?.trim();

          const secret = headerKid
            ? jwtRotation.secretByKid.get(headerKid)
            : (jwtRotation.legacyFallbackSecret ?? jwtRotation.currentSecret);

          if (!secret) {
            throw new Error(
              headerKid
                ? `JWT secret not configured for kid "${headerKid}"`
                : 'JWT token missing kid and JWT_SECRET_LEGACY_FALLBACK is not configured',
            );
          }

          done(null, secret);
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      workspaceId: payload.workspaceId,
      permissions: payload.permissions,
    };
  }
}

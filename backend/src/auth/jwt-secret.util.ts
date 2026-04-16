import type { ConfigService } from '@nestjs/config';

const DEFAULT_CURRENT_KID = 'current';
const PREVIOUS_SECRETS_VAR = 'JWT_SECRET_PREVIOUS_SECRETS';
const LEGACY_FALLBACK_VAR = 'JWT_SECRET_LEGACY_FALLBACK';

export interface JwtSecretRotationConfig {
  currentKid: string;
  currentSecret: string;
  legacyFallbackSecret: string | null;
  secretByKid: Map<string, string>;
}

export function readJwtSecretRotationConfig(
  config: ConfigService,
): JwtSecretRotationConfig {
  const currentSecret = config.getOrThrow<string>('JWT_SECRET');
  const currentKid =
    normalize(config.get<string>('JWT_SECRET_KID')) ?? DEFAULT_CURRENT_KID;
  const legacyFallbackSecret =
    normalize(config.get<string>(LEGACY_FALLBACK_VAR)) ?? null;

  const secretByKid = new Map<string, string>([[currentKid, currentSecret]]);
  const previousSecretsRaw = normalize(
    config.get<string>(PREVIOUS_SECRETS_VAR),
  );

  if (previousSecretsRaw) {
    for (const chunk of previousSecretsRaw.split(',')) {
      const [rawKid, ...rawSecretParts] = chunk.split(':');
      const kid = normalize(rawKid);
      const secret = normalize(rawSecretParts.join(':'));

      if (!kid || !secret) {
        throw new Error(
          `${PREVIOUS_SECRETS_VAR} must use the format "kid:secret,kid2:secret2"`,
        );
      }

      if (secretByKid.has(kid)) {
        throw new Error(
          `Duplicate JWT secret kid "${kid}" configured in ${PREVIOUS_SECRETS_VAR}`,
        );
      }

      secretByKid.set(kid, secret);
    }
  }

  return {
    currentKid,
    currentSecret,
    legacyFallbackSecret,
    secretByKid,
  };
}

function normalize(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

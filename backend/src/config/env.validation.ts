const REQUIRED_VARS = ['JWT_SECRET', 'DATABASE_URL'];

const VALID_NODE_ENVS = ['development', 'staging', 'production'] as const;
type NodeEnv = (typeof VALID_NODE_ENVS)[number];

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const nodeEnv = config['NODE_ENV'] as string | undefined;
  if (nodeEnv && !(VALID_NODE_ENVS as readonly string[]).includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be one of: ${VALID_NODE_ENVS.join(', ')} (got "${nodeEnv}")`,
    );
  }

  if (nodeEnv === 'production' && !config['CRYPTO_KEY']) {
    throw new Error('CRYPTO_KEY is required in production');
  }

  return config;
}

export function getNodeEnv(): NodeEnv {
  const raw = process.env.NODE_ENV ?? 'development';
  return (VALID_NODE_ENVS as readonly string[]).includes(raw)
    ? (raw as NodeEnv)
    : 'development';
}

export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

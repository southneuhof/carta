import { env } from '$env/dynamic/private';
import { createTrustedOriginChecker, parseTrustedOrigins } from '@southneuhof/landing-sveltekit-framework';

export function getTrustedOrigins(): string[] {
  return parseTrustedOrigins({
    authUrl: env.BETTER_AUTH_URL,
    appUrl: env.PUBLIC_APP_URL,
    authTrustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
    trustedOrigins: env.TRUSTED_ORIGINS,
  });
}

const isTrustedOriginChecker = createTrustedOriginChecker({
  trustedOrigins: getTrustedOrigins(),
  nodeEnv: env.NODE_ENV,
});

export function isTrustedOrigin(origin: string | null): boolean {
  return isTrustedOriginChecker(origin);
}

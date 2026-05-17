import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import bcrypt from 'bcryptjs';

import prisma from '$lib/utils/prisma';
import { getTrustedOrigins } from '$lib/server/trusted-origins';

const DEFAULT_BASE_URL = env.BETTER_AUTH_URL || env.PUBLIC_APP_URL || 'http://localhost:5173';
const DEFAULT_SECRET =
  env.BETTER_AUTH_SECRET || 'development-secret-change-this-before-production-use';

export const auth = betterAuth({
  baseURL: DEFAULT_BASE_URL,
  secret: DEFAULT_SECRET,
  trustedOrigins: getTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    transaction: true,
  }),
  advanced: {
    database: {
      generateId: 'serial',
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  user: {
    modelName: 'User',
  },
  session: {
    modelName: 'AuthSession',
  },
  account: {
    modelName: 'AuthAccount',
  },
  verification: {
    modelName: 'AuthVerification',
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});

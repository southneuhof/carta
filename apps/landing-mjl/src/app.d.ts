import type { Prisma } from '@prisma/client';

type CurrentUser = Prisma.UserGetPayload<{
  include: {
    role: {
      include: {
        permissions: true;
      };
    };
  };
}> | null;

declare global {
  namespace App {
    interface Locals {
      auth?: unknown;
      user: CurrentUser;
      isPrivilegedRole?: boolean;
    }
  }
}

export {};

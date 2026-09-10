import { z } from 'zod/v4';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    roleIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type CreateUserInput = z.input<typeof createUserSchema>;

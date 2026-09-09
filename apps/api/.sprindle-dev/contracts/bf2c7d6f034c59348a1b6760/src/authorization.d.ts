import type { PermissionCode } from './authorization/catalog';
export type OrgIdentity = {
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        statusCode: string;
    };
    roleCodes: string[];
    permissions: ReadonlySet<PermissionCode>;
};
export declare function resolveIdentity(userId: string): Promise<OrgIdentity | null>;
export declare function resolveEffectivePermissions(userId: string): Promise<ReadonlySet<PermissionCode>>;
export declare function can(userId: string, permissionCode: PermissionCode): Promise<boolean>;

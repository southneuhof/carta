import type { FileRequestArgs, RouteParameters } from '@southneuhof/sprindle';
import type { PermissionCode } from './authorization/catalog';
import { type OrgIdentity } from './authorization';
export type { OrgIdentity };
type IdentityArgs = Pick<FileRequestArgs<RouteParameters, object>, 'c' | 'identity'>;
export declare function orgIdentity(args: IdentityArgs): Promise<OrgIdentity | null>;
export declare function requireOrgIdentity(args: IdentityArgs): Promise<OrgIdentity>;
export declare function requirePathParam(args: IdentityArgs, name: string): string;
export declare function requirePermission(code: PermissionCode): (args: any) => Promise<void>;

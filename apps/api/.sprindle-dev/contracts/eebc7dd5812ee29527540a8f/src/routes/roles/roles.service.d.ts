export declare function listRolePermissions(roleId: string): Promise<{
    id: string;
    permissionCode: string;
    name: string;
    description: string | null;
    assigned: boolean;
}[]>;
export declare function setRolePermission(actorUserId: string, roleId: string, permissionId: string, active: boolean): Promise<{
    id: string;
    permissionCode: string;
    name: string;
    description: string | null;
    assigned: boolean;
}>;
export declare function listRoleAssignments(userId: string): Promise<{
    id: string;
    roleCode: string;
    name: string;
    description: string | null;
    active: boolean;
    assigned: boolean;
}[]>;
export declare function setRoleAssignment(actorUserId: string, userId: string, roleId: string, active: boolean): Promise<{
    id: string;
    roleCode: string;
    name: string;
    description: string | null;
    active: boolean;
    assigned: boolean;
}[]>;
export declare function assignInitialRoles(actorUserId: string, userId: string, roleIds: string[]): Promise<void>;
export declare function validateInitialRoles(roleIds: string[]): Promise<string[]>;
export declare function deleteUnassignedRole(roleId: string): Promise<{
    ok: boolean;
}>;

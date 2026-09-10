export declare function listRoleAssignments(userId: string): Promise<{
    id: string;
    roleCode: string;
    name: string;
    description: string | null;
    active: boolean;
    assigned: boolean;
}[]>;

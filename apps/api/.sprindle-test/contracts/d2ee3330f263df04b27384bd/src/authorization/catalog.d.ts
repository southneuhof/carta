export declare const targetTypes: readonly ["global"];
export type TargetType = (typeof targetTypes)[number];
export declare const authorizationModules: readonly [{
    readonly code: "users";
    readonly name: "Users";
    readonly active: true;
    readonly permissions: readonly [{
        readonly code: "view-users";
        readonly name: "View Users";
        readonly description: "View user accounts.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "list-users";
        readonly name: "List Users";
        readonly description: "List user accounts.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "detail-users";
        readonly name: "Detail Users";
        readonly description: "View a user account.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "create-users";
        readonly name: "Create Users";
        readonly description: "Create user accounts.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "update-users";
        readonly name: "Update Users";
        readonly description: "Update user accounts.";
        readonly targetType: "global";
        readonly active: true;
    }];
}, {
    readonly code: "roles";
    readonly name: "Roles";
    readonly active: true;
    readonly permissions: readonly [{
        readonly code: "view-roles";
        readonly name: "View Roles";
        readonly description: "View roles.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "list-roles";
        readonly name: "List Roles";
        readonly description: "List roles.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "detail-roles";
        readonly name: "Detail Roles";
        readonly description: "View a role.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "create-roles";
        readonly name: "Create Roles";
        readonly description: "Create roles.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "update-roles";
        readonly name: "Update Roles";
        readonly description: "Update roles.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "delete-roles";
        readonly name: "Delete Roles";
        readonly description: "Delete roles.";
        readonly targetType: "global";
        readonly active: true;
    }];
}, {
    readonly code: "permissions";
    readonly name: "Permissions";
    readonly active: true;
    readonly permissions: readonly [{
        readonly code: "view-permissions";
        readonly name: "View Permissions";
        readonly description: "View permissions.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "list-permissions";
        readonly name: "List Permissions";
        readonly description: "List permissions.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "detail-permissions";
        readonly name: "Detail Permissions";
        readonly description: "View a permission.";
        readonly targetType: "global";
        readonly active: true;
    }];
}, {
    readonly code: "role-permissions";
    readonly name: "Role Permissions";
    readonly active: true;
    readonly permissions: readonly [{
        readonly code: "list-role-permissions";
        readonly name: "List Role Permissions";
        readonly description: "List a role's permissions.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "create-role-permissions";
        readonly name: "Grant Role Permission";
        readonly description: "Grant a permission to a role.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "delete-role-permissions";
        readonly name: "Revoke Role Permission";
        readonly description: "Revoke a permission from a role.";
        readonly targetType: "global";
        readonly active: true;
    }];
}, {
    readonly code: "role-assignments";
    readonly name: "Role Assignments";
    readonly active: true;
    readonly permissions: readonly [{
        readonly code: "list-role-assignments";
        readonly name: "List Role Assignments";
        readonly description: "List a user's roles.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "create-role-assignments";
        readonly name: "Assign Role";
        readonly description: "Assign a role to a user.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly code: "delete-role-assignments";
        readonly name: "Unassign Role";
        readonly description: "Remove a role from a user.";
        readonly targetType: "global";
        readonly active: true;
    }];
}, {
    readonly name: "Stop Work Actions";
    readonly active: true;
    readonly permissions: readonly [{
        readonly name: "View Stop Work Actions";
        readonly description: "Open the Stop Work Action module.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "List Stop Work Actions";
        readonly description: "List Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Detail Stop Work Actions";
        readonly description: "View a Stop Work Action report.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Create Stop Work Actions";
        readonly description: "Create Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Update Stop Work Actions";
        readonly description: "Update draft Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Submit Stop Work Actions";
        readonly description: "Submit Stop Work Action reports for review.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Review Stop Work Actions";
        readonly description: "Review submitted Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Reject Stop Work Actions";
        readonly description: "Return Stop Work Action reports to draft.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Approve Stop Work Actions";
        readonly description: "Approve reviewed Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Upload Final Stop Work Actions";
        readonly description: "Upload final Stop Work Action documents.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Close Stop Work Actions";
        readonly description: "Close approved Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }, {
        readonly name: "Delete Stop Work Actions";
        readonly description: "Delete draft Stop Work Action reports.";
        readonly targetType: "global";
        readonly active: true;
    }];
    module: (typeof authorizationModules)[number];
    permission: (typeof authorizationModules)[number]["permissions"][number];
}>>;

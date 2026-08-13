import { describe, expect, it } from "vitest";
import {
  authorizationModules,
  moduleForPermission,
  permissionByCode,
  projectPermissionCodes,
  realmForPermission,
  systemPermissionCodes,
} from "./catalog";
import type { PermissionCode } from "./catalog";

describe("authorization catalog", () => {
  type CatalogPermission = (typeof authorizationModules)[number]["permissions"][number];
  const permissions = authorizationModules.flatMap((module) => [...module.permissions]) as CatalogPermission[];

  it("has unique active modules and permissions", () => {
    expect(new Set(authorizationModules.map((module) => module.code)).size).toBe(authorizationModules.length);
    expect(new Set(permissions.map((permission) => permission.code)).size).toBe(permissions.length);
    expect(authorizationModules.every((module) => module.active)).toBe(true);
    expect(permissions.every((permission) => permission.active)).toBe(true);
  });

  it("resolves every permission to one module and realm", () => {
    for (const permission of permissions) {
      expect(permissionByCode[permission.code]).toMatchObject({ permission });
      expect(moduleForPermission(permission.code).permissions.filter((item) => item.code === permission.code)).toHaveLength(1);
      expect(realmForPermission(permission.code)).toBe(moduleForPermission(permission.code).realm);
    }
  });

  it("keeps project creation in the system realm", () => {
    expect(realmForPermission("create-projects")).toBe("system");
    expect(systemPermissionCodes).toContain("create-projects");
    expect(projectPermissionCodes).not.toContain("create-projects");
  });

  it("keeps owner records and PTS reads in the system realm", () => {
    const systemCodes: PermissionCode[] = [
      "view-projects",
      "list-projects",
      "detail-projects",
      "update-projects",
      "delete-projects",
      "view-work-items",
      "view-project-vendors",
      "view-qhsse-pts",
      "list-qhsse-pts",
      "detail-qhsse-pts",
    ];
    expect(systemCodes.every((code) => realmForPermission(code) === "system")).toBe(true);
  });

  it("keeps PTS workflow codes in the project realm", () => {
    const workflowCodes = authorizationModules
      .find((module) => module.code === "qhsse-pts-workflow")!
      .permissions.map((permission) => permission.code);
    expect(workflowCodes[0]).toBe("create-qhsse-pts");
    expect(workflowCodes.at(-1)).toBe("close-qhsse-pts");
    expect(workflowCodes.every((code) => realmForPermission(code) === "project")).toBe(true);
  });

  it("does not compile removed permission codes into the catalog", () => {
    const removed = [
      "view-role-groups",
      "manage-role-groups",
      "manage-permissions",
      "view-user-roles",
      "manage-user-roles",
      "view-project-users",
      "manage-project-users",
      "access-all-projects",
      "show-qhsse-pts",
      "manage-divisions",
      "manage-projects",
      "manage-work-items",
      "manage-project-vendors",
      "manage-pts-work-categories",
      "manage-root-causes",
      "manage-roles",
      "manage-role-permissions",
      "manage-system-role-assignments",
      "manage-project-role-assignments",
      "manage-business-categories",
      "manage-uoms",
      "manage-number-configs",
    ];
    expect(removed.some((code) => code in permissionByCode)).toBe(false);
  });
});

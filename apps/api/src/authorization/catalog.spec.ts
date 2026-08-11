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

  it("keeps project records and QHSSE operations in the project realm", () => {
    const projectCodes: PermissionCode[] = [
      "view-projects",
      "manage-projects",
      "view-work-items",
      "view-project-vendors",
      ...authorizationModules.find((module) => module.code === "qhsse-pts")!.permissions.map((permission) => permission.code),
    ];
    expect(projectCodes.every((code) => realmForPermission(code) === "project")).toBe(true);
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
    ];
    expect(removed.some((code) => code in permissionByCode)).toBe(false);
  });
});

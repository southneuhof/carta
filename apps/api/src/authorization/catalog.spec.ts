import { describe, expect, it } from "vitest";
import { permissionByCode, permissions } from "./catalog";

describe("authorization catalog", () => {
  it("has unique active permissions", () => {
    expect(new Set(permissions.map((item) => item.code)).size).toBe(permissions.length);
    expect(permissions.every((item) => item.active)).toBe(true);
  });

  it("resolves every permission by code", () => {
    for (const item of permissions) {
      expect(permissionByCode[item.code]).toMatchObject({ permission: item });
    }
  });

  it("covers every route guard code", () => {
    const guards = [
      "list-users",
      "detail-users",
      "create-users",
      "update-users",
      "list-roles",
      "detail-roles",
      "create-roles",
      "update-roles",
      "delete-roles",
      "list-permissions",
      "detail-permissions",
      "list-role-permissions",
      "create-role-permissions",
      "delete-role-permissions",
      "list-role-assignments",
      "create-role-assignments",
      "delete-role-assignments",
    ] as const;
    for (const code of guards) {
      expect(code in permissionByCode).toBe(true);
    }
  });
});

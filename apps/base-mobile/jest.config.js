module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  moduleFileExtensions: [
    "native.ts",
    "native.tsx",
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
  ],
};

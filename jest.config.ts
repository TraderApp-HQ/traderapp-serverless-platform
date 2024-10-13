export default {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "js", "mjs"],
    testMatch: ["**/__tests__/**/*.(test|spec).ts"],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    moduleDirectories: ["node_modules", "src"],
    collectCoverage: true,
    coverageReporters: ["text", "lcov"],
    collectCoverageFrom: ["src/**/*.ts"],
};

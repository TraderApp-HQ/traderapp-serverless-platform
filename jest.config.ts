/* eslint-disable @typescript-eslint/no-require-imports */
import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions } = require('./tsconfig.json');

export default {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "js", "mjs"],
    testMatch: [
        "**/?(*.)+(test|spec).ts"
    ],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    moduleDirectories: ["node_modules", "src"],
    collectCoverage: true,
    coverageReporters: ["text", "lcov"],
    collectCoverageFrom: ["src/**/*.ts"],
    testPathIgnorePatterns: ["/node_modules/", "/.aws-sam/"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),  // This maps the 'src/*' paths for Jest
};

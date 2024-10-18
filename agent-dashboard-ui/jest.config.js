module.exports = {
  verbose: true,
  collectCoverage: true,
  moduleFileExtensions: ["ts", "tsx", "js"],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: ["**/test/unit/**/*.+(ts|tsx)"],
  moduleNameMapper: {
    "@client/(.*)": "<rootDir>/src/client/$1",
    "@server/(.*)": "<rootDir>/src/server/$1"
  },
  setupTestFrameworkScriptFile: "<rootDir>/test/config/jest.setup.js"
};
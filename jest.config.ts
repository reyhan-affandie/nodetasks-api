export default {
  preset: "ts-jest", // Use ts-jest for TypeScript support
  testEnvironment: "node", // Set the test environment to Node.js
  setupFiles: ["dotenv/config"], // Load environment variables before the tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // Run setup logic after the environment is ready
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Adjust path aliases to match your project structure
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { useESM: true }], // Enable ES6 module support with ts-jest
  },
  testPathIgnorePatterns: ["/node_modules/"],
};

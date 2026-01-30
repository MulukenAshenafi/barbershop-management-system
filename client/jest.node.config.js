/**
 * Jest config for Node-only tests (api, authService).
 * No React Native / jest-expo; avoids Object.defineProperty and RN setup issues.
 */
module.exports = {
  displayName: 'node',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/api.test.js',
    '**/__tests__/authService.login.test.js',
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/AsyncStorage.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native)/)',
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    '!**/node_modules/**',
  ],
};

/**
 * Jest config for React Native tests (CartContext, BookService.guard).
 * Uses jest-expo preset for proper RN environment; RN tests were excluded
 * from default run due to Object.defineProperty / RN setup issues in node env.
 */
module.exports = {
  displayName: 'rn',
  preset: 'jest-expo',
  testMatch: [
    '**/__tests__/CartContext.test.js',
    '**/__tests__/BookService.guard.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.rn.js'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/AsyncStorage.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base))/',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  collectCoverageFrom: [
    'context/**/*.js',
    'screens/BookService.js',
    '!**/node_modules/**',
  ],
};

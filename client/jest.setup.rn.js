/**
 * Setup for React Native tests (CartContext, BookService.guard).
 * Mocks API and auth so screens that fetch on mount don't fail.
 * Paths are relative to project root (client/).
 */
jest.mock('./config', () => ({ default: { apiBaseUrl: 'http://test/api', forceWelcome: false } }));

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock('./services/auth', () => ({
  getStoredCustomer: jest.fn(() => Promise.resolve(null)),
}));

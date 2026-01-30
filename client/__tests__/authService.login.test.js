/**
 * Auth service – loginWithEmail success and error paths.
 */
jest.mock('../config', () => ({ default: { apiBaseUrl: 'http://test/api' } }));
jest.mock('expo-apple-authentication', () => ({}));
const mockPost = jest.fn();
jest.mock('axios', () => ({
  post: (...args) => mockPost(...args),
}));
const { loginWithEmail } = require('../services/authService');

beforeEach(() => {
  mockPost.mockReset();
  jest.clearAllMocks();
});

describe('loginWithEmail', () => {
  it('returns error when username or password empty', async () => {
    let result = await loginWithEmail('', 'pass');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();

    result = await loginWithEmail('user', '');
    expect(result.success).toBe(false);
  });

  it('returns success when backend returns token/user', async () => {
    mockPost.mockResolvedValue({
      data: {
        success: true,
        token: 'jwt-here',
        user: { id: 1, name: 'Test', email: 'test@test.com' },
      },
    });

    const result = await loginWithEmail('user', 'password');
    expect(result.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringMatching(/customers\/login/),
      { username: 'user', password: 'password' }
    );
  });

  it('returns error when backend returns failure', async () => {
    mockPost.mockResolvedValue({
      data: { success: false, message: 'Invalid credentials' },
    });

    const result = await loginWithEmail('user', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid credentials|Login failed/);
  });

  it('returns error message from API on network/4xx error', async () => {
    mockPost.mockRejectedValue({
      response: { data: { message: 'Account locked' } },
    });

    const result = await loginWithEmail('user', 'pass');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Account locked');
  });
});

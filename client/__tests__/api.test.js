/**
 * API helpers – getApiErrorMessage.
 */
jest.mock('../config', () => ({ default: { apiBaseUrl: 'http://test/api' } }));
const { getApiErrorMessage } = require('../services/api');

describe('getApiErrorMessage', () => {
  it('returns fallback when err is null/undefined', () => {
    expect(getApiErrorMessage(null)).toBe('Something went wrong.');
    expect(getApiErrorMessage(undefined, 'Custom')).toBe('Custom');
  });

  it('returns response.data.message when present', () => {
    const err = { response: { data: { message: 'Invalid input' } } };
    expect(getApiErrorMessage(err)).toBe('Invalid input');
  });

  it('returns response.data.detail when message is missing', () => {
    const err = { response: { data: { detail: 'Not found' } } };
    expect(getApiErrorMessage(err)).toBe('Not found');
  });

  it('returns validation errors as string when data.errors is object', () => {
    const err = { response: { data: { errors: { email: ['Invalid email'] } } } };
    expect(getApiErrorMessage(err)).toContain('email');
    expect(getApiErrorMessage(err)).toContain('Invalid email');
  });

  it('returns 401 message for unauthorized', () => {
    const err = { response: { status: 401 } };
    expect(getApiErrorMessage(err)).toBe('Session expired.');
  });

  it('returns 409 conflict message', () => {
    const err = { response: { status: 409, data: { detail: 'Slot taken' } } };
    expect(getApiErrorMessage(err)).toBe('Slot taken');
  });

  it('returns err.message when no response data', () => {
    const err = new Error('Network error');
    expect(getApiErrorMessage(err)).toBe('Network error');
  });
});
